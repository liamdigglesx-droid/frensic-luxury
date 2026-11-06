import { getActor, getAdminClient } from './_lib/supabase.js';
import { ApiError, requireMethod, sendError } from './_lib/http.js';
import { enforceRateLimit } from './_lib/rateLimit.js';
import { sendPaidSlack } from './_lib/notifications.js';

export default async function handler(req, res) {
  try {
    requireMethod(req);
    const actor = await getActor(req);
    if (!actor.privileged) throw new ApiError(403, 'Staff access required.', 'forbidden');
    await enforceRateLimit(req, 'slack', 30, 3600);
    const { booking: submitted, test = false } = req.body || {};
    if (!submitted?.id) throw new ApiError(400, 'Booking is required.');
    const client = getAdminClient();
    const { data: booking } = await client.from('bookings').select('*').eq('id', submitted.id).eq('payment_status', 'paid').single();
    if (!booking) throw new ApiError(404, 'Paid booking not found.');
    const result = await sendPaidSlack(client, booking, { test });
    return res.json({ success: true, ...result });
  } catch (error) { return sendError(res, error); }
}
