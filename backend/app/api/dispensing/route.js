import { getActor } from '../../../lib/auth.js';
import { jsonError, readJson, requestFailure, requireSameOrigin } from '../../../lib/api.js';
import { query, withTransaction } from '../../../lib/db.js';
import { dispensingSchema } from '../../../lib/dispensing-input.js';

export async function GET(request) {
  try {
    const actor = await getActor(request);
    if (!actor) return jsonError('Authentication required.', 401);
    if (actor.role !== 'admin') return jsonError('Admin access required.', 403);
    const { rows } = await query(
      `SELECT pm.prescription_id, pm.medicine_id, m.name AS medicine_name,
              pm.quantity_prescribed, COALESCE(dispensed.quantity_dispensed, 0) AS quantity_dispensed,
              GREATEST(pm.quantity_prescribed - COALESCE(dispensed.quantity_dispensed, 0), 0) AS quantity_remaining,
              pr.created_at AS prescription_created_at,
              a.patient_id, p.full_name AS patient_name,
              a.doctor_id, d.full_name AS doctor_name,
              COALESCE(batches.options, '[]'::jsonb) AS available_batches
       FROM PRESCRIPTION_MEDICINE AS pm
       JOIN PRESCRIPTION AS pr ON pr.prescription_id = pm.prescription_id
       JOIN CONSULTATION AS c ON c.consultation_id = pr.consultation_id
       JOIN APPOINTMENT AS a ON a.appointment_id = c.appointment_id
       JOIN PATIENT AS p ON p.patient_id = a.patient_id
       JOIN DOCTOR AS d ON d.doctor_id = a.doctor_id
       JOIN MEDICINE AS m ON m.medicine_id = pm.medicine_id
       LEFT JOIN LATERAL (
         SELECT sum(pd.quantity)::integer AS quantity_dispensed
         FROM PRESCRIPTION_DISPENSING AS pd
         WHERE pd.prescription_id = pm.prescription_id AND pd.medicine_id = pm.medicine_id
       ) AS dispensed ON TRUE
       LEFT JOIN LATERAL (
         SELECT jsonb_agg(jsonb_build_object(
           'inventory_batch_id', ib.inventory_batch_id,
           'batch_number', ib.batch_number,
           'expiry_date', ib.expiry_date,
           'quantity_on_hand', ib.quantity_on_hand
         ) ORDER BY ib.expiry_date) AS options
         FROM MEDICINE_INVENTORY_BATCH AS ib
         WHERE ib.medicine_id = pm.medicine_id
           AND ib.expiry_date >= CURRENT_DATE AND ib.quantity_on_hand > 0
       ) AS batches ON TRUE
       WHERE pm.quantity_prescribed IS NOT NULL
         AND COALESCE(dispensed.quantity_dispensed, 0) < pm.quantity_prescribed
       ORDER BY pr.created_at, m.name`,
    );
    return Response.json({ dispensing_queue: rows });
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
    // The existing user_role enum has no pharmacy role; restrict dispensing to admins.
    if (actor.role !== 'admin') return jsonError('Admin access required to dispense prescriptions.', 403);
    const input = await readJson(request, dispensingSchema);
    const result = await withTransaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [input.transaction_key]);
      const duplicate = await client.query(
        'SELECT dispensing_id FROM PRESCRIPTION_DISPENSING WHERE transaction_key = $1',
        [input.transaction_key],
      );
      if (duplicate.rows[0]) return { duplicate: true };

      const lineResult = await client.query(
        `SELECT quantity_prescribed FROM PRESCRIPTION_MEDICINE
         WHERE prescription_id = $1 AND medicine_id = $2 FOR UPDATE`,
        [input.prescription_id, input.medicine_id],
      );
      if (!lineResult.rows[0]) {
        const error = new Error('Prescription medicine not found.');
        error.code = '23503';
        throw error;
      }
      const prescribed = lineResult.rows[0].quantity_prescribed;
      if (prescribed === null) {
        const error = new Error('This prescription has no prescribed quantity and cannot be dispensed.');
        error.code = 'P0001';
        throw error;
      }
      const previous = await client.query(
        `SELECT COALESCE(sum(quantity), 0)::integer AS quantity
         FROM PRESCRIPTION_DISPENSING
         WHERE prescription_id = $1 AND medicine_id = $2`,
        [input.prescription_id, input.medicine_id],
      );
      if (previous.rows[0].quantity + input.quantity > prescribed) {
        const error = new Error('Dispensing quantity exceeds the prescribed remainder.');
        error.code = 'P0001';
        throw error;
      }

      const batchResult = await client.query(
        `SELECT inventory_batch_id, quantity_on_hand
         FROM MEDICINE_INVENTORY_BATCH
         WHERE inventory_batch_id = $1 AND medicine_id = $2
           AND expiry_date >= CURRENT_DATE
         FOR UPDATE`,
        [input.inventory_batch_id, input.medicine_id],
      );
      if (!batchResult.rows[0]) {
        const error = new Error('The selected batch is missing, expired, or belongs to another medicine.');
        error.code = '23503';
        throw error;
      }
      if (batchResult.rows[0].quantity_on_hand < input.quantity) {
        const error = new Error('Dispensing quantity exceeds available stock.');
        error.code = 'P0001';
        throw error;
      }

      await client.query(
        `UPDATE MEDICINE_INVENTORY_BATCH
         SET quantity_on_hand = quantity_on_hand - $2, updated_at = CURRENT_TIMESTAMP
         WHERE inventory_batch_id = $1`,
        [input.inventory_batch_id, input.quantity],
      );
      await client.query(
        `INSERT INTO INVENTORY_MOVEMENT
           (transaction_key, inventory_batch_id, changed_by, action, quantity_delta, note)
         VALUES ($1, $2, $3, 'stock_out', $4, 'Prescription dispensing')`,
        [input.transaction_key, input.inventory_batch_id, actor.userId, -input.quantity],
      );
      const dispensing = await client.query(
        `INSERT INTO PRESCRIPTION_DISPENSING
           (transaction_key, prescription_id, medicine_id, inventory_batch_id, dispensed_by, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING dispensing_id, transaction_key, prescription_id, medicine_id,
                   inventory_batch_id, quantity, created_at`,
        [input.transaction_key, input.prescription_id, input.medicine_id,
         input.inventory_batch_id, actor.userId, input.quantity],
      );
      return { duplicate: false, dispensing: dispensing.rows[0] };
    }, actor.userId);

    if (result.duplicate) return jsonError('This dispensing transaction was already processed.', 409);
    return Response.json(result, { status: 201 });
  } catch (error) {
    if (error?.code === 'P0001') return jsonError(error.message, 409);
    return requestFailure(error);
  }
}
