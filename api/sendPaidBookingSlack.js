import { getAdminClient } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { booking: submittedBooking, test = false } = req.body || {}; if (!submittedBooking?.id) return res.status(400).json({ error: 'Booking is required' });
    const { data: booking, error } = await getAdminClient().from('bookings').select('*').eq('id', submittedBooking.id).eq('payment_status', 'paid').single();
    if (error || !booking) return res.status(404).json({ error: 'Paid booking not found' });
    const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(booking.total_amount || 0);
    const response = await fetch('https://slack.com/api/chat.postMessage', { method: 'POST', headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ channel: process.env.SLACK_CHANNEL_ID, text: `${test ? 'Slack payment alerts are active' : 'New payment completed'}: ${booking.guest_name || 'Guest'} paid ${amount} for ${booking.item_name}.` }) });
    const data = await response.json(); if (!data.ok) throw new Error(data.error || 'Slack notification failed');
    return res.json({ sent: true });
  } catch (error) { return res.status(500).json({ error: error.message }); }
}