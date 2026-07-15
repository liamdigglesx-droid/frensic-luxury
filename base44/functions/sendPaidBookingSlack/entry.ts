import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const isAuthenticated = await base44.auth.isAuthenticated();
    if (!isAuthenticated) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { booking, test = false } = await req.json();
    if (!booking) return Response.json({ error: 'Booking is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('slackbot');
    const amount = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(booking.total_amount || 0);
    const title = test ? 'Slack payment alerts are active' : 'New payment completed';
    const guest = booking.guest_name || 'Guest';
    const item = booking.item_name || (booking.booking_type === 'drive' ? 'Car rental' : 'Apartment stay');
    const reference = booking.payment_reference || 'Not provided';
    const method = booking.payment_method === 'bank_transfer' ? 'Bank transfer' : booking.payment_method === 'paystack' ? 'Paystack' : 'Not provided';

    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: 'C0BGZA9J7QF',
        username: 'Frensic Luxury',
        icon_url: 'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/602d336b8_Untitleddesign1.png',
        text: `${title}: ${guest} paid ${amount} for ${item}.`,
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: title } },
          { type: 'section', fields: [
            { type: 'mrkdwn', text: `*Guest*\n${guest}` },
            { type: 'mrkdwn', text: `*Amount*\n${amount}` },
            { type: 'mrkdwn', text: `*Booking*\n${item}` },
            { type: 'mrkdwn', text: `*Payment method*\n${method}` },
            { type: 'mrkdwn', text: `*Reference*\n${reference}` },
            { type: 'mrkdwn', text: `*Service*\n${booking.booking_type === 'drive' ? 'Car rental' : 'Apartment stay'}` },
          ] },
        ],
      }),
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.error || 'Slack notification failed');
    return Response.json({ sent: true, channel: data.channel, timestamp: data.ts });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});