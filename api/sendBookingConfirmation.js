import { getGoogleAccessToken } from './_lib/google.js';
import { getAdminClient } from './_lib/supabase.js';

const encode = text => Buffer.from(text).toString('base64url');
const mime = ({ to, subject, html }) => encode([`From: Frensic Luxury Apartment <me>`,`To: ${to}`,`Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,`MIME-Version: 1.0`,`Content-Type: text/html; charset=UTF-8`,'',html].join('\r\n'));
async function send(accessToken, message) {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ raw: message }) });
  if (!response.ok) throw new Error(await response.text());
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { booking: submittedBooking, notificationType } = req.body || {};
    if (!submittedBooking?.id) return res.status(400).json({ error: 'Missing booking' });
    const client = getAdminClient();
    const { data: booking, error: bookingError } = await client.from('bookings').select('*').eq('id', submittedBooking.id).single();
    if (bookingError || !booking) return res.status(404).json({ error: 'Booking not found' });
    const receipt = notificationType === 'receipt_submitted';
    if (receipt ? booking.transfer_status !== 'receipt_submitted' : booking.payment_status !== 'paid') return res.status(400).json({ error: 'Booking is not ready for notification' });
    let receiptUrl = booking.payment_receipt_url;
    if (receipt && receiptUrl?.startsWith('payment-receipts/')) {
      const path = receiptUrl.replace('payment-receipts/', '');
      const { data } = await client.storage.from('payment-receipts').createSignedUrl(path, 604800);
      receiptUrl = data?.signedUrl;
    }
    const details = `<h1>${receipt ? 'Payment receipt submitted' : 'Booking confirmed'}</h1><p>Guest: ${booking.guest_name || booking.guest_email}<br>Booking: ${booking.item_name || 'N/A'}<br>Dates: ${booking.start_date} to ${booking.end_date}<br>Total: ₦${Number(booking.total_amount || 0).toLocaleString()}<br>Reference: ${booking.payment_reference || 'N/A'}</p>${receiptUrl ? `<p><a href="${receiptUrl}">View payment receipt</a></p>` : ''}`;
    const token = await getGoogleAccessToken();
    if (!receipt) await send(token, mime({ to: booking.guest_email, subject: `Booking Confirmed — ${booking.item_name}`, html: details }));
    await send(token, mime({ to: 'frensicluxuryapartment@gmail.com', subject: receipt ? `[PAYMENT RECEIPT] ${booking.item_name}` : `[NEW BOOKING] ${booking.item_name}`, html: details }));
    return res.json({ success: true });
  } catch (error) { return res.status(500).json({ error: error.message }); }
}