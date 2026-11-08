const KEY = 'frensic_guest_booking_tokens';

function read() {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

export function rememberGuestBooking(booking) {
  if (!booking?.id || !booking?.guest_access_token) return;
  const tokens = read();
  tokens[booking.id] = booking.guest_access_token;
  sessionStorage.setItem(KEY, JSON.stringify(tokens));
}

export function guestBookingToken(id) {
  return id ? read()[id] || null : null;
}
