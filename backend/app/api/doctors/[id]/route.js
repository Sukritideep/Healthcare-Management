import { z } from 'zod';
import { getActor } from '../../../../lib/auth.js';
import { jsonError, readJson, requestFailure, requireSameOrigin } from '../../../../lib/api.js';
import { query, withTransaction } from '../../../../lib/db.js';

const schema = z.object({ is_active: z.boolean() }).strict();

export async function PATCH(request, { params }) {
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  try {
    const actor = await getActor(request);
    if (!actor) return jsonError('Authentication required.', 401);
    if (actor.role !== 'admin') return jsonError('Admin access required.', 403);
    const { id } = await params;
    const doctorId = z.string().uuid().parse(id);
    const input = await readJson(request, schema);
    const { rows } = await withTransaction((client) => client.query(
      `UPDATE DOCTOR SET is_active = $2
       WHERE doctor_id = $1
       RETURNING doctor_id, full_name, is_active`,
      [doctorId, input.is_active],
    ), actor.userId);
    if (!rows[0]) return jsonError('Doctor not found.', 404);
    return Response.json({ doctor: rows[0] });
  } catch (error) {
    return requestFailure(error);
  }
}
