import crypto from 'node:crypto';
import { getAdminClient } from '../supabase.js';
import { ApiError, readRawBody, requireMethod, sendError } from '../http.js';
import { verifyPaystackTransaction } from '../paystack.js';
import { markBookingPaid } from '../bookings.js';
import { notifyPaidBooking } from '../notifications.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  try {
    requireMethod(req);
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new ApiError(503, 'Webhook is not configured.', 'webhook_unconfigured');
    const raw = await readRawBody(req);
    const signature = req.headers['x-paystack-signature'];
    const expected = crypto.createHmac('sha512', secret).update(raw).digest('hex');
    if (typeof signature !== 'string' || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      throw new ApiError(401, 'Invalid webhook signature.', 'invalid_signature');
    }
    const event = JSON.parse(raw.toString('utf8'));
    if (event.event !== 'charge.success') return res.json({ received: true, ignored: true });
    const reference = event.data?.reference;
    if (!reference) throw new ApiError(400, 'Payment reference is required.');
    const transaction = await verifyPaystackTransaction(reference);
    const client = getAdminClient();
    const result = await markBookingPaid(client, transaction);
    if (!result.alreadyPaid && !result.conflict) await notifyPaidBooking(client, result.booking);
    return res.json({ received: true, conflict: result.conflict });
  } catch (error) { return sendError(res, error); }
}
