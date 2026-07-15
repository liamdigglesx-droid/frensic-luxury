import { getGoogleAccessToken } from './_lib/google.js';
import { getAdminClient } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { booking: submittedBooking } = req.body || {}; if (!submittedBooking?.id) return res.status(400).json({ error: 'Missing booking' });
    const { data: booking, error } = await getAdminClient().from('bookings').select('*').eq('id', submittedBooking.id).eq('payment_status', 'paid').single();
    if (error || !booking) return res.status(404).json({ error: 'Paid booking not found' });
    const accessToken = await getGoogleAccessToken();
    const event = { summary: `[BOOKED] ${booking.item_name}`, description: `Guest: ${booking.guest_name}\nEmail: ${booking.guest_email}\nPhone: ${booking.guest_phone || 'N/A'}\nTotal: ₦${Number(booking.total_amount).toLocaleString()}\nRef: ${booking.payment_reference || 'N/A'}`, start: { date: booking.start_date }, end: { date: booking.end_date } };
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
    if (!response.ok) throw new Error(await response.text());
    const created = await response.json(); return res.json({ success: true, eventId: created.id });
  } catch (error) { return res.status(500).json({ error: error.message }); }
}