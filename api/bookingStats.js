import { getActor, getAdminClient } from './_lib/supabase.js';
import { ApiError, requireMethod, sendError } from './_lib/http.js';

export default async function handler(req, res) {
  try {
    requireMethod(req);
    const actor = await getActor(req);
    if (!actor.privileged) throw new ApiError(403, 'Staff access required.', 'forbidden');
    const year = Number(req.body?.year) || new Date().getFullYear();
    if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new ApiError(400, 'Invalid year.');
    const { data, error } = await getAdminClient().rpc('booking_stats', { p_year: year });
    if (error) throw new ApiError(503, 'Statistics are temporarily unavailable.');
    return res.json(data);
  } catch (error) { return sendError(res, error); }
}
