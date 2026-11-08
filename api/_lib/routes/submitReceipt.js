import { getActor, getAdminClient, hasBookingAccess, publicBooking } from '../supabase.js';
import { ApiError, requireMethod, sendError } from '../http.js';
import { enforceRateLimit } from '../rateLimit.js';
import { sendBookingEmail } from '../notifications.js';

export default async function handler(req, res) {
  try {
    requireMethod(req);
    await enforceRateLimit(req, 'receipt-submit', 10, 3600);
    const { bookingId, path } = req.body || {};
    const client = getAdminClient();
    const actor = await getActor(req);
    const { data: booking } = await client.from('bookings').select('*').eq('id', bookingId).single();
    if (!booking) throw new ApiError(404, 'Booking not found.');
    if (!hasBookingAccess(req, booking, actor)) throw new ApiError(403, 'You do not have access to this booking.', 'forbidden');
    if (booking.payment_method !== 'bank_transfer' || booking.payment_status !== 'pending') throw new ApiError(400, 'This booking cannot accept a transfer receipt.');
    if (!path || path !== booking.receipt_upload_path) throw new ApiError(400, 'Prepare the receipt upload before submitting it.');
    const folder = path.split('/').slice(0, -1).join('/');
    const name = path.split('/').at(-1);
    const { data: files, error: listError } = await client.storage.from('payment-receipts').list(folder, { search: name, limit: 1 });
    const file = files?.find(item => item.name === name);
    if (listError || !file) throw new ApiError(400, 'Receipt upload was not completed.');
    if (file.metadata?.size > 50 * 1024 * 1024) throw new ApiError(400, 'Receipt must be 50MB or smaller.');
    const changes = {
      payment_receipt_url: `payment-receipts/${path}`,
      receipt_submitted_at: new Date().toISOString(),
      transfer_status: 'receipt_submitted',
      hold_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      receipt_upload_path: null,
    };
    const { data: updated, error } = await client.from('bookings').update(changes).eq('id', booking.id).eq('payment_status', 'pending').select().single();
    if (error || !updated) throw new ApiError(503, 'Receipt could not be recorded.');
    try { await sendBookingEmail(client, updated, { receipt: true }); } catch (error) { console.error('[receipt-email]', error?.message); }
    return res.json({ booking: publicBooking(updated) });
  } catch (error) { return sendError(res, error); }
}
