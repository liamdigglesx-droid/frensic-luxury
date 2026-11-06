import { getAdminClient } from './_lib/supabase.js';
import { ApiError, requireMethod, sendError } from './_lib/http.js';
import { enforceRateLimit } from './_lib/rateLimit.js';
import { checkAvailability, findCatalogItem, validateBookingInput } from './_lib/bookings.js';

export default async function handler(req, res) {
  try {
    requireMethod(req);
    await enforceRateLimit(req, 'availability', 120, 60);
    const body = req.body || {};
    const input = validateBookingInput({ ...body, guest_name: 'Availability check', guest_email: 'availability@example.com', guest_phone: '0000000000', guests_count: body.guests_count || 1 });
    const client = getAdminClient();
    const item = await findCatalogItem(client, input.bookingType, input.itemId);
    const result = await checkAvailability(client, { itemId: item.slug || item.legacy_id || item.id, startDate: input.startDate, endDate: input.endDate, excludeBookingId: body.excludeBookingId });
    return res.json(result);
  } catch (error) {
    if (error instanceof ApiError && error.message.includes('guest')) return sendError(res, new ApiError(400, 'Enter valid booking details.'));
    return sendError(res, error);
  }
}
