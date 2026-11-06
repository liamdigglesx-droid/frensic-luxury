import { getActor, getAdminClient, hasBookingAccess } from './_lib/supabase.js';
import { ApiError, requireMethod, sendError } from './_lib/http.js';
import { enforceRateLimit } from './_lib/rateLimit.js';
import { sendBookingEmail } from './_lib/notifications.js';

export default async function handler(req, res) {
  try {
    requireMethod(req);
    await enforceRateLimit(req, 'confirmation', 10, 3600);
    const { booking: submitted, notificationType } = req.body || {};
    if (!submitted?.id) throw new ApiError(400, 'Booking is required.');
    const client = getAdminClient();
    const actor = await getActor(req);
    const { data: booking } = await client.from('bookings').select('*').eq('id', submitted.id).single();
    if (!booking) throw new ApiError(404, 'Booking not found.');
    const receipt = notificationType === 'receipt_submitted';
    if (!hasBookingAccess(req, booking, actor)) throw new ApiError(403, 'You do not have access to this booking.', 'forbidden');
    if (!receipt && !actor.privileged) throw new ApiError(403, 'Staff access required.', 'forbidden');
    if (receipt ? booking.transfer_status !== 'receipt_submitted' : booking.payment_status !== 'paid') throw new ApiError(400, 'Booking is not ready for notification.');
    const result = await sendBookingEmail(client, booking, { receipt });
    return res.json({ success: true, ...result });
  } catch (error) { return sendError(res, error); }
}
