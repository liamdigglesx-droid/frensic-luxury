import { getGoogleAccessToken } from './google.js';
import { ApiError } from './http.js';

const BUSINESS_EMAIL = 'frensicluxuryapartment@gmail.com';
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const encode = text => Buffer.from(text).toString('base64url');
const mime = ({ to, subject, html }) => encode([
  'From: Frensic Luxury Apartment <me>', `To: ${to}`,
  `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
  'MIME-Version: 1.0', 'Content-Type: text/html; charset=UTF-8', '', html,
].join('\r\n'));

async function sendGmail(accessToken, message) {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: message }),
  });
  if (!response.ok) throw new ApiError(502, 'Email delivery failed.', 'email_failed');
}

export async function sendBookingEmail(client, booking, { receipt = false } = {}) {
  const sentColumn = receipt ? 'receipt_notification_sent_at' : 'confirmation_sent_at';
  if (booking[sentColumn]) return { skipped: true };
  let receiptUrl = '';
  if (receipt && booking.payment_receipt_url?.startsWith('payment-receipts/')) {
    const path = booking.payment_receipt_url.replace('payment-receipts/', '');
    const { data } = await client.storage.from('payment-receipts').createSignedUrl(path, 604800);
    receiptUrl = data?.signedUrl || '';
  }
  const details = `<h1>${receipt ? 'Payment receipt submitted' : 'Booking confirmed'}</h1>
<p>Guest: ${escapeHtml(booking.guest_name || booking.guest_email)}<br>
Booking: ${escapeHtml(booking.item_name || 'N/A')}<br>
Dates: ${escapeHtml(booking.start_date)} to ${escapeHtml(booking.end_date)}<br>
Total: ₦${Number(booking.total_amount || 0).toLocaleString('en-NG')}<br>
Reference: ${escapeHtml(booking.payment_reference || 'N/A')}</p>
${receiptUrl ? `<p><a href="${escapeHtml(receiptUrl)}">View payment receipt</a></p>` : ''}`;
  const token = await getGoogleAccessToken();
  if (!receipt) await sendGmail(token, mime({ to: booking.guest_email, subject: `Booking Confirmed — ${booking.item_name}`, html: details }));
  await sendGmail(token, mime({ to: BUSINESS_EMAIL, subject: receipt ? `[PAYMENT RECEIPT] ${booking.item_name}` : `[NEW BOOKING] ${booking.item_name}`, html: details }));
  await client.from('bookings').update({ [sentColumn]: new Date().toISOString() }).eq('id', booking.id).is(sentColumn, null);
  return { sent: true };
}

export async function addBookingCalendarEvent(client, booking) {
  if (booking.calendar_event_id) return { skipped: true, eventId: booking.calendar_event_id };
  const accessToken = await getGoogleAccessToken();
  const event = {
    summary: `[BOOKED] ${booking.item_name}`,
    description: `Guest: ${booking.guest_name}\nEmail: ${booking.guest_email}\nPhone: ${booking.guest_phone || 'N/A'}\nTotal: NGN ${Number(booking.total_amount).toLocaleString('en-NG')}\nRef: ${booking.payment_reference || 'N/A'}`,
    start: { date: booking.start_date }, end: { date: booking.end_date },
    extendedProperties: { private: { bookingId: booking.id } },
  };
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(event),
  });
  if (!response.ok) throw new ApiError(502, 'Calendar update failed.', 'calendar_failed');
  const created = await response.json();
  await client.from('bookings').update({ calendar_event_id: created.id }).eq('id', booking.id).is('calendar_event_id', null);
  const { data: current } = await client.from('bookings').select('calendar_event_id').eq('id', booking.id).single();
  return { eventId: current?.calendar_event_id || created.id };
}

export function isSlackConfigured() {
  return Boolean(process.env.SLACK_BOT_TOKEN && process.env.SLACK_CHANNEL_ID);
}

export async function sendPaidSlack(client, booking, { test = false } = {}) {
  if (!test && booking.slack_notified_at) return { skipped: true };
  if (!isSlackConfigured()) {
    // Slack is optional. Never label an unconfigured channel as a delivery failure
    // in the payment flow, but let an explicit dashboard test report the gap.
    if (!test) return { skipped: true, reason: 'unconfigured' };
    throw new ApiError(503, 'Slack notifications are not configured.', 'slack_unconfigured');
  }
  const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(booking.total_amount || 0);
  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: process.env.SLACK_CHANNEL_ID, text: `${test ? 'Slack payment alerts are active' : 'New payment completed'}: ${booking.guest_name || 'Guest'} paid ${amount} for ${booking.item_name}.` }),
  });
  const data = await response.json();
  if (!data.ok) throw new ApiError(502, 'Slack notification failed.', 'slack_failed');
  if (!test) await client.from('bookings').update({ slack_notified_at: new Date().toISOString() }).eq('id', booking.id).is('slack_notified_at', null);
  return { sent: true };
}

export async function notifyPaidBooking(client, booking) {
  const tasks = [sendBookingEmail(client, booking), addBookingCalendarEvent(client, booking), sendPaidSlack(client, booking)];
  const results = await Promise.allSettled(tasks);
  results.forEach(result => { if (result.status === 'rejected') console.error('[notification]', result.reason?.message || result.reason); });
  return results.map(result => result.status === 'fulfilled');
}
