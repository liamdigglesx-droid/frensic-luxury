import { getActor, getAdminClient, hasBookingAccess, publicBooking } from '../supabase.js';
import { ApiError, requireMethod, sendError } from '../http.js';
import { enforceRateLimit } from '../rateLimit.js';
import { verifyPaystackTransaction } from '../paystack.js';
import { markBookingPaid } from '../bookings.js';
import { notifyPaidBooking } from '../notifications.js';

export default async function handler(req, res) {
  try {
    requireMethod(req);
    await enforceRateLimit(req, 'payment-verify', 20, 3600);
    const { bookingId } = req.body || {};
    if (!bookingId) throw new ApiError(400, 'Booking is required.');
    const client = getAdminClient();
    const actor = await getActor(req);
    const { data: booking, error } = await client.from('bookings').select('*').eq('id', bookingId).single();
    if (error || !booking) throw new ApiError(404, 'Booking not found.');
    if (!hasBookingAccess(req, booking, actor)) throw new ApiError(403, 'You do not have access to this booking.', 'forbidden');
    if (booking.payment_method !== 'paystack') throw new ApiError(400, 'This booking is not a card payment.');
    const transaction = await verifyPaystackTransaction(booking.payment_reference);
    const result = await markBookingPaid(client, transaction);
    if (!result.alreadyPaid && !result.conflict) await notifyPaidBooking(client, result.booking);
    if (result.conflict) return res.status(409).json({ error: 'Payment was recorded, but the dates were taken. Please contact support for a refund or rebooking.', code: 'reservation_conflict', booking: publicBooking(result.booking) });
    return res.json({ verified: true, booking: publicBooking(result.booking) });
  } catch (error) { return sendError(res, error); }
}
