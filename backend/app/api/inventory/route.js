import { getActor } from '../../../lib/auth.js';
import { jsonError, readJson, requestFailure, requireSameOrigin } from '../../../lib/api.js';
import { query, withTransaction } from '../../../lib/db.js';
import { inventoryChangeSchema } from '../../../lib/inventory-input.js';

export async function GET(request) {
  try {
    const actor = await getActor(request);
    if (!actor) return jsonError('Authentication required.', 401);
    if (actor.role !== 'admin') return jsonError('Admin access required.', 403);

    const url = new URL(request.url);
    const search = (url.searchParams.get('search') || '').trim().slice(0, 100);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 50, 1), 100);
    const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);
    const { rows } = await query(
      `SELECT b.inventory_batch_id, b.medicine_id, m.name AS medicine_name,
              m.brand_manufacturer, m.unit_price, b.batch_number, b.expiry_date,
              b.quantity_on_hand, b.reorder_level, b.supplier_name,
              b.quantity_on_hand <= b.reorder_level AS low_stock,
              b.expiry_date <= CURRENT_DATE + 90 AS expiring_soon
       FROM MEDICINE_INVENTORY_BATCH AS b
       JOIN MEDICINE AS m ON m.medicine_id = b.medicine_id
       WHERE ($1 = '' OR m.name ILIKE '%' || $1 || '%'
                         OR m.brand_manufacturer ILIKE '%' || $1 || '%'
                         OR b.batch_number ILIKE '%' || $1 || '%')
       ORDER BY b.expiry_date, m.name, b.batch_number
       LIMIT $2 OFFSET $3`,
      [search, limit, offset],
    );
    return Response.json({ inventory: rows, limit, offset });
  } catch (error) {
    return requestFailure(error);
  }
}

export async function POST(request) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  try {
    const actor = await getActor(request);
    if (!actor) return jsonError('Authentication required.', 401);
    if (actor.role !== 'admin') return jsonError('Admin access required.', 403);
    const input = await readJson(request, inventoryChangeSchema);

    const result = await withTransaction(async (client) => {
      // Serialize retries for the same idempotency key before touching stock.
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [input.transaction_key]);
      const duplicate = await client.query(
        'SELECT movement_id FROM INVENTORY_MOVEMENT WHERE transaction_key = $1',
        [input.transaction_key],
      );
      if (duplicate.rows[0]) return { duplicate: true };

      let batch;
      if (input.action === 'stock_in') {
        const existing = await client.query(
          `SELECT inventory_batch_id, quantity_on_hand, expiry_date
           FROM MEDICINE_INVENTORY_BATCH
           WHERE medicine_id = $1 AND batch_number = $2
           FOR UPDATE`,
          [input.medicine_id, input.batch_number],
        );
        if (existing.rows[0]) {
          if (String(existing.rows[0].expiry_date) !== input.expiry_date) {
            const error = new Error('Batch expiry does not match the existing batch.');
            error.code = '22023';
            throw error;
          }
          const updated = await client.query(
            `UPDATE MEDICINE_INVENTORY_BATCH
             SET quantity_on_hand = quantity_on_hand + $2,
                 reorder_level = $3,
                 supplier_name = COALESCE($4, supplier_name),
                 updated_at = CURRENT_TIMESTAMP
             WHERE inventory_batch_id = $1
             RETURNING inventory_batch_id, quantity_on_hand`,
            [existing.rows[0].inventory_batch_id, input.quantity, input.reorder_level, input.supplier_name || null],
          );
          batch = updated.rows[0];
        } else {
          const inserted = await client.query(
            `INSERT INTO MEDICINE_INVENTORY_BATCH
               (medicine_id, batch_number, expiry_date, quantity_on_hand,
                reorder_level, supplier_name)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING inventory_batch_id, quantity_on_hand`,
            [input.medicine_id, input.batch_number, input.expiry_date,
             input.quantity, input.reorder_level, input.supplier_name || null],
          );
          batch = inserted.rows[0];
        }
      } else {
        const locked = await client.query(
          `SELECT inventory_batch_id, quantity_on_hand
           FROM MEDICINE_INVENTORY_BATCH
           WHERE inventory_batch_id = $1 FOR UPDATE`,
          [input.inventory_batch_id],
        );
        if (!locked.rows[0]) {
          const error = new Error('Inventory batch not found.');
          error.code = '23503';
          throw error;
        }
        if (locked.rows[0].quantity_on_hand < input.quantity) {
          const error = new Error('Stock-out quantity exceeds available stock.');
          error.code = 'P0001';
          throw error;
        }
        const updated = await client.query(
          `UPDATE MEDICINE_INVENTORY_BATCH
           SET quantity_on_hand = quantity_on_hand - $2, updated_at = CURRENT_TIMESTAMP
           WHERE inventory_batch_id = $1
           RETURNING inventory_batch_id, quantity_on_hand`,
          [input.inventory_batch_id, input.quantity],
        );
        batch = updated.rows[0];
      }

      const movement = await client.query(
        `INSERT INTO INVENTORY_MOVEMENT
           (transaction_key, inventory_batch_id, changed_by, action, quantity_delta, note)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING movement_id, inventory_batch_id, action, quantity_delta, created_at`,
        [input.transaction_key, batch.inventory_batch_id, actor.userId,
         input.action, input.action === 'stock_in' ? input.quantity : -input.quantity,
         input.note || null],
      );
      return { duplicate: false, movement: movement.rows[0], quantity_on_hand: batch.quantity_on_hand };
    }, actor.userId);

    if (result.duplicate) return jsonError('This inventory transaction was already processed.', 409);
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error?.code === 'P0001') return jsonError(error.message, 409);
    if (error?.code === '22023') return jsonError(error.message, 409);
    return requestFailure(error);
  }
}
