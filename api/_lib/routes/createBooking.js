import { getAdminClient } from '../supabase.js';
import { requireMethod, sendError } from '../http.js';
import { enforceRateLimit } from '../rateLimit.js';
import { createBookingRecord } from '../bookings.js';

export default async function handler(req, res) {
  try {
    requireMethod(req);
    await enforceRateLimit(req, 'booking-create', 20, 3600);
    const booking = await createBookingRecord(getAdminClient(), req.body || {});
    return res.status(201).json(booking);
  } catch (error) { return sendError(res, error); }
}
