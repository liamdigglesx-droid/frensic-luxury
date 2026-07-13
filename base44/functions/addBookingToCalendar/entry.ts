import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { booking } = body;

    if (!booking) {
      return Response.json({ error: 'Missing booking' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    const isStay = booking.booking_type === 'stay';
    const typeLabel = isStay ? 'Apartment Stay' : 'Car Rental';
    const startLabel = isStay ? 'Check-In' : 'Pick-Up';
    const endLabel = isStay ? 'Check-Out' : 'Return';

    // Google Calendar uses date-only for all-day events
    const event = {
      summary: `[BOOKED] ${booking.item_name} — ${typeLabel}`,
      description: [
        `Guest: ${booking.guest_name || 'N/A'}`,
        `Email: ${booking.guest_email || 'N/A'}`,
        `Phone: ${booking.guest_phone || 'N/A'}`,
        `${startLabel}: ${booking.start_date}`,
        `${endLabel}: ${booking.end_date}`,
        `Duration: ${booking.nights_or_days} ${isStay ? 'nights' : 'days'}`,
        `Guests: ${booking.guests_count || 1}`,
        booking.chauffeur ? 'Chauffeur: Yes' : '',
        `Total Paid: ₦${Number(booking.total_amount).toLocaleString()}`,
        `Ref: ${booking.payment_reference || 'N/A'}`,
        booking.special_requests ? `Special Requests: ${booking.special_requests}` : '',
      ].filter(Boolean).join('\n'),
      start: { date: booking.start_date },
      end: { date: booking.end_date },
      colorId: isStay ? '5' : '11', // banana for stay, tomato for drive
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: `Calendar API error: ${err}` }, { status: 500 });
    }

    const created = await res.json();
    return Response.json({ success: true, eventId: created.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});