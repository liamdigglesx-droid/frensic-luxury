import { ApiError } from './http.js';

export async function verifyPaystackTransaction(reference) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new ApiError(503, 'Card payment verification is not configured.', 'payment_unconfigured');
  if (typeof reference !== 'string' || !/^[A-Za-z0-9._=-]{6,100}$/.test(reference)) {
    throw new ApiError(400, 'Invalid payment reference.', 'invalid_reference');
  }
  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.status || !payload.data) {
    throw new ApiError(502, 'Payment provider could not verify this transaction.', 'payment_verification_failed');
  }
  return payload.data;
}

export function assertSuccessfulPayment(transaction, booking) {
  const expectedAmount = Math.round(Number(booking.total_amount) * 100);
  if (
    transaction.status !== 'success' ||
    transaction.reference !== booking.payment_reference ||
    Number(transaction.amount) !== expectedAmount ||
    transaction.currency !== 'NGN' ||
    String(transaction.customer?.email || '').toLowerCase() !== String(booking.guest_email).toLowerCase()
  ) {
    throw new ApiError(400, 'Payment details do not match this booking.', 'payment_mismatch');
  }
}
