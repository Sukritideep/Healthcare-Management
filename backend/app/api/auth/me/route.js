import { getActor } from '../../../../lib/auth.js';
import { jsonError, requestFailure } from '../../../../lib/api.js';
import { query } from '../../../../lib/db.js';

export async function GET(request) {
  try {
    const actor = await getActor(request);
    if (!actor) return jsonError('Authentication required.', 401);
    const { rows } = await query(
      `SELECT u.user_id, u.email, u.role::text AS role,
              COALESCE(p.full_name, d.full_name) AS full_name
       FROM APP_USER AS u
       LEFT JOIN PATIENT AS p ON p.patient_id = u.user_id
       LEFT JOIN DOCTOR AS d ON d.doctor_id = u.user_id
       WHERE u.user_id = $1`,
      [actor.userId],
    );
    if (!rows[0]) return jsonError('Authentication required.', 401);
    return Response.json({ user: rows[0] });
  } catch (error) {
    return requestFailure(error);
  }
}
