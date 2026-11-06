import crypto from 'node:crypto';
import { ApiError } from './http.js';
import { hashGuestToken, publicBooking } from './supabase.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HOLD_MINUTES = 20;
export const CHAUFFEUR_FEE_PER_DAY = 30000;

export function businessToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(new Date());
}

export function nightsBetween(startDate, endDate) {
  return Math.round((Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86400000);
}

export function validateBookingInput(body = {}) {
  const bookingType = body.booking_type;
  const paymentMethod = body.payment_method || 'paystack';
  const itemId = String(body.item_id || '').trim();
  const startDate = body.start_date;
  const endDate = body.end_date;
  const guestEmail = String(body.guest_email || '').trim().toLowerCase();
  const guestName = String(body.guest_name || '').trim();
  const guestPhone = String(body.guest_phone || '').trim();
  const guestsCount = Number(body.guests_count);
  if (!['stay', 'drive'].includes(bookingType)) throw new ApiError(400, 'Choose a valid booking type.');
  if (!['paystack', 'bank_transfer'].includes(paymentMethod)) throw new ApiError(400, 'Choose a valid payment method.');
  if (!itemId || itemId.length > 100) throw new ApiError(400, 'Choose a valid room or vehicle.');
  if (!DATE.test(startDate || '') || !DATE.test(endDate || '')) throw new ApiError(400, 'Enter valid dates.');
  const nights = nightsBetween(startDate, endDate);
  if (!Number.isFinite(nights) || nights < 1 || nights > 365) throw new ApiError(400, 'End date must be after start date, within one year.');
  if (startDate < businessToday()) throw new ApiError(400, 'Start date cannot be in the past.');
  if (!Number.isInteger(guestsCount) || guestsCount < 1 || guestsCount > 20) throw new ApiError(400, 'Enter a valid guest count.');
  if (!guestName || guestName.length > 120) throw new ApiError(400, 'Enter your full name.');
  if (!EMAIL.test(guestEmail) || guestEmail.length > 254) throw new ApiError(400, 'Enter a valid email address.');
  if (!guestPhone || guestPhone.length > 30) throw new ApiError(400, 'Enter a valid phone number.');
  const specialRequests = String(body.special_requests || '').slice(0, 2000);
  const chauffeur = bookingType === 'drive' && body.chauffeur === true;
  return { bookingType, paymentMethod, itemId, startDate, endDate, nights, guestEmail, guestName, guestPhone, guestsCount, specialRequests, chauffeur };
}

export async function findCatalogItem(client, bookingType, itemId) {
  const table = bookingType === 'stay' ? 'rooms' : 'cars';
  let result = await client.from(table).select('*').eq('slug', itemId).eq('active', true).maybeSingle();
  if (!result.data && UUID.test(itemId)) result = await client.from(table).select('*').eq('id', itemId).eq('active', true).maybeSingle();
  if (!result.data) result = await client.from(table).select('*').eq('legacy_id', itemId).eq('active', true).maybeSingle();
  if (result.error) throw new ApiError(503, 'Catalog is temporarily unavailable.');
  if (!result.data) throw new ApiError(400, 'The selected room or vehicle is unavailable.');
  return result.data;
}

export function quoteBooking(item, input) {
  const unitPrice = Number(input.bookingType === 'stay' ? item.price_per_night : item.price_per_day);
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new ApiError(503, 'Catalog pricing is unavailable.');
  const capacity = Number(input.bookingType === 'stay' ? item.max_guests : item.seats);
  if (Number.isFinite(capacity) && capacity > 0 && input.guestsCount > capacity) throw new ApiError(400, `This option accepts at most ${capacity} guests.`);
  if (input.chauffeur && item.chauffeur_available === false) throw new ApiError(400, 'Chauffeur service is unavailable for this vehicle.');
  const chauffeurFee = input.chauffeur ? CHAUFFEUR_FEE_PER_DAY * input.nights : 0;
  const totalAmount = (Math.round(unitPrice * 100) * input.nights + Math.round(chauffeurFee * 100)) / 100;
  return { unitPrice, totalAmount };
}

export function isActiveHold(row, now = Date.now()) {
  if (row.booking_status === 'cancelled') return false;
  if (row.payment_status === 'paid') return true;
  return row.payment_status === 'pending'
    && row.transfer_status !== 'expired'
    && row.hold_expires_at != null
    && Date.parse(row.hold_expires_at) > now;
}

export async function checkAvailability(client, { itemId, startDate, endDate, excludeBookingId }) {
  const { data, error } = await client.from('bookings')
    .select('id,item_id,start_date,end_date,payment_status,transfer_status,booking_status,hold_expires_at')
    .eq('item_id', itemId).lt('start_date', endDate).gt('end_date', startDate).limit(500);
  if (error) throw new ApiError(503, 'Availability is temporarily unavailable.');
  const conflict = (data || []).some(row => row.id !== excludeBookingId && isActiveHold(row));
  return { available: !conflict };
}

export async function createBookingRecord(client, body) {
  const input = validateBookingInput(body);
  const item = await findCatalogItem(client, input.bookingType, input.itemId);
  const canonicalItemId = item.slug || item.legacy_id || item.id;
  const availability = await checkAvailability(client, { itemId: canonicalItemId, startDate: input.startDate, endDate: input.endDate });
  if (!availability.available) throw new ApiError(409, 'Those dates are no longer available. Please choose different dates.', 'dates_unavailable');
  const { unitPrice, totalAmount } = quoteBooking(item, input);
  const guestToken = crypto.randomBytes(32).toString('base64url');
  const record = {
    booking_type: input.bookingType,
    item_id: canonicalItemId,
    item_name: item.name,
    start_date: input.startDate,
    end_date: input.endDate,
    guest_name: input.guestName,
    guest_email: input.guestEmail,
    guest_phone: input.guestPhone,
    guests_count: input.guestsCount,
    chauffeur: input.chauffeur,
    special_requests: input.specialRequests,
    nights_or_days: input.nights,
    unit_price: unitPrice,
    total_amount: totalAmount,
    payment_status: 'pending',
    payment_method: input.paymentMethod,
    payment_reference: input.paymentMethod === 'paystack' ? `FRENSIC_${crypto.randomUUID().replaceAll('-', '').toUpperCase()}` : null,
    transfer_status: input.paymentMethod === 'bank_transfer' ? 'awaiting_payment' : null,
    hold_expires_at: new Date(Date.now() + HOLD_MINUTES * 60000).toISOString(),
    guest_access_hash: hashGuestToken(guestToken),
  };
  const { data, error } = await client.from('bookings').insert(record).select().single();
  if (error) {
    if (['23505', '23P01'].includes(error.code)) throw new ApiError(409, 'Those dates are no longer available. Please choose different dates.', 'dates_unavailable');
    throw new ApiError(503, 'Booking could not be created. Please try again.');
  }
  return { ...publicBooking(data), guest_access_token: guestToken };
}

export async function markBookingPaid(client, transaction) {
  const reference = transaction.reference;
  const { data: booking, error } = await client.from('bookings').select('*').eq('payment_reference', reference).single();
  if (error || !booking) throw new ApiError(404, 'Booking not found for this payment reference.', 'booking_not_found');
  if (booking.payment_status === 'paid') return { booking, alreadyPaid: true, conflict: false };
  const expectedAmount = Math.round(Number(booking.total_amount) * 100);
  if (
    transaction.status !== 'success' || Number(transaction.amount) !== expectedAmount ||
    transaction.currency !== 'NGN' ||
    String(transaction.customer?.email || '').toLowerCase() !== booking.guest_email.toLowerCase()
  ) throw new ApiError(400, 'Payment details do not match this booking.', 'payment_mismatch');

  const update = {
    payment_status: 'paid', booking_status: 'confirmed', hold_expires_at: null,
    payment_verified_at: new Date().toISOString(), payment_verified_by: 'paystack',
  };
  let result = await client.from('bookings').update(update).eq('id', booking.id).eq('payment_status', 'pending').select();
  if (result.error && ['23505', '23P01'].includes(result.error.code)) {
    result = await client.from('bookings').update({ ...update, booking_status: 'cancelled' }).eq('id', booking.id).eq('payment_status', 'pending').select();
    if (result.data?.[0]) return { booking: result.data[0], alreadyPaid: false, conflict: true };
  }
  if (result.error) throw new ApiError(503, 'Payment was received but booking confirmation is pending. Please contact support.', 'confirmation_pending');
  if (!result.data?.[0]) {
    const { data: current } = await client.from('bookings').select('*').eq('id', booking.id).single();
    if (current?.payment_status === 'paid') return { booking: current, alreadyPaid: true, conflict: current.booking_status === 'cancelled' };
    throw new ApiError(409, 'Booking state changed. Please contact support.', 'booking_state_changed');
  }
  return { booking: result.data[0], alreadyPaid: false, conflict: false };
}
