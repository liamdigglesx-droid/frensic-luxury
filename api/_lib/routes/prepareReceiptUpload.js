import crypto from 'node:crypto';
import { getActor, getAdminClient, hasBookingAccess } from '../supabase.js';
import { ApiError, requireMethod, sendError } from '../http.js';
import { enforceRateLimit } from '../rateLimit.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
const MAX_SIZE = 50 * 1024 * 1024;

export default async function handler(req, res) {
  try {
    requireMethod(req);
    await enforceRateLimit(req, 'receipt-upload', 10, 3600);
    const { bookingId, fileName, contentType, size } = req.body || {};
    const extension = TYPES[contentType];
    if (!extension) throw new ApiError(400, 'Upload a JPEG, PNG, WebP, or PDF receipt.');
    if (!Number.isFinite(Number(size)) || Number(size) < 1 || Number(size) > MAX_SIZE) throw new ApiError(400, 'Receipt must be 50MB or smaller.');
    const client = getAdminClient();
    const actor = await getActor(req);
    const { data: booking } = await client.from('bookings').select('*').eq('id', bookingId).single();
    if (!booking) throw new ApiError(404, 'Booking not found.');
    if (!hasBookingAccess(req, booking, actor)) throw new ApiError(403, 'You do not have access to this booking.', 'forbidden');
    if (booking.payment_method !== 'bank_transfer' || booking.payment_status !== 'pending') throw new ApiError(400, 'This booking cannot accept a transfer receipt.');
    if (booking.transfer_status === 'awaiting_payment' && Date.parse(booking.hold_expires_at) < Date.now()) throw new ApiError(409, 'The transfer window expired. Please start a new booking.', 'transfer_expired');
    const path = `receipts/${booking.id}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await client.storage.from('payment-receipts').createSignedUploadUrl(path);
    if (error || !data?.token) throw new ApiError(503, 'Receipt upload could not be prepared.');
    await client.from('bookings').update({ receipt_upload_path: path }).eq('id', booking.id);
    return res.json({ path: data.path || path, token: data.token, bucket: 'payment-receipts', fileName });
  } catch (error) { return sendError(res, error); }
}
