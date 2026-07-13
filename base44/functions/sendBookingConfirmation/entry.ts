import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

function buildMimeEmail({ to, subject, html, fromName }) {
  const boundary = `boundary_${Date.now()}`;
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const raw = [
    `From: ${fromName} <me>`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    `Content-Transfer-Encoding: base64`,
    ``,
    btoa(unescape(encodeURIComponent(html))),
    `--${boundary}--`,
  ].join('\r\n');

  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function buildEmailHtml(booking) {
  const isStay = booking.booking_type === 'stay';
  const typeLabel = isStay ? 'Apartment Stay' : 'Car Rental';
  const startLabel = isStay ? 'Check-In' : 'Pick-Up';
  const endLabel = isStay ? 'Check-Out' : 'Return';
  const unitLabel = isStay ? 'nights' : 'days';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#050505;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050505;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border:1px solid rgba(201,168,76,0.2);max-width:600px;">
        <!-- Header -->
        <tr>
          <td style="background:#050505;padding:30px 40px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.15);">
            <img src="https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/feaba7ac8_FrensicLuxuryApartmentLogo.png" width="160" alt="Frensic Luxury" style="display:block;margin:0 auto;" />
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="color:#C9A84C;font-size:28px;font-weight:300;margin:0 0 8px 0;letter-spacing:2px;">BOOKING CONFIRMED</h1>
            <p style="color:#888888;font-size:13px;letter-spacing:3px;text-transform:uppercase;margin:0 0 32px 0;">${typeLabel}</p>

            <p style="color:#F9F9F9;font-size:15px;line-height:1.7;margin:0 0 24px 0;">
              Dear <strong style="color:#C9A84C;">${booking.guest_name || 'Valued Guest'}</strong>,
            </p>
            <p style="color:#888888;font-size:14px;line-height:1.8;margin:0 0 32px 0;">
              Your booking has been confirmed and payment has been successfully processed. We look forward to providing you with an exceptional luxury experience.
            </p>

            <!-- Booking Details -->
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(201,168,76,0.15);margin-bottom:32px;">
              <tr><td colspan="2" style="background:rgba(201,168,76,0.08);padding:12px 20px;border-bottom:1px solid rgba(201,168,76,0.15);">
                <span style="color:#C9A84C;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Booking Summary</span>
              </td></tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:12px 20px;color:#888888;font-size:13px;">Booking For</td>
                <td style="padding:12px 20px;color:#F9F9F9;font-size:13px;text-align:right;">${booking.item_name || 'N/A'}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:12px 20px;color:#888888;font-size:13px;">${startLabel}</td>
                <td style="padding:12px 20px;color:#F9F9F9;font-size:13px;text-align:right;">${booking.start_date}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:12px 20px;color:#888888;font-size:13px;">${endLabel}</td>
                <td style="padding:12px 20px;color:#F9F9F9;font-size:13px;text-align:right;">${booking.end_date}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:12px 20px;color:#888888;font-size:13px;">Duration</td>
                <td style="padding:12px 20px;color:#F9F9F9;font-size:13px;text-align:right;">${booking.nights_or_days} ${unitLabel}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:12px 20px;color:#888888;font-size:13px;">Guests</td>
                <td style="padding:12px 20px;color:#F9F9F9;font-size:13px;text-align:right;">${booking.guests_count}</td>
              </tr>
              <tr style="border-bottom:1px solid rgba(255,255,255,0.04);">
                <td style="padding:12px 20px;color:#888888;font-size:13px;">Payment Reference</td>
                <td style="padding:12px 20px;color:#F9F9F9;font-size:13px;text-align:right;">${booking.payment_reference || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding:14px 20px;color:#C9A84C;font-size:15px;font-weight:600;">Total Paid</td>
                <td style="padding:14px 20px;color:#C9A84C;font-size:15px;font-weight:600;text-align:right;">₦${Number(booking.total_amount).toLocaleString()}</td>
              </tr>
            </table>

            <p style="color:#888888;font-size:13px;line-height:1.8;margin:0 0 32px 0;">
              If you have any questions or special requests, please don't hesitate to contact us. Our team is available to assist you at any time.
            </p>

            <!-- Contact -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(201,168,76,0.05);border:1px solid rgba(201,168,76,0.12);margin-bottom:32px;">
              <tr><td style="padding:20px 24px;">
                <p style="color:#C9A84C;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin:0 0 12px 0;">Need Help?</p>
                <p style="color:#888888;font-size:13px;margin:0 0 4px 0;">📞 +234 704 600 7419 &nbsp;|&nbsp; +234 803 706 8065</p>
                <p style="color:#888888;font-size:13px;margin:0;">✉️ info@frensicluxuryapartment.com.ng</p>
              </td></tr>
            </table>

            <p style="color:#888888;font-size:13px;line-height:1.8;margin:0;">
              Thank you for choosing Frensic Luxury.<br/>
              <em style="color:#C9A84C;">Where Every Journey Begins in Style, and Every Stay Feels Like Home.</em>
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="color:#555555;font-size:11px;margin:0;">© ${new Date().getFullYear()} Frensic Luxury Apartment · Durumi, Abuja, Nigeria</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { booking } = body;

    if (!booking || !booking.guest_email) {
      return Response.json({ error: 'Missing booking or guest_email' }, { status: 400 });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('gmail');

    const subject = `Booking Confirmed — ${booking.item_name || 'Frensic Luxury'}`;
    const html = buildEmailHtml(booking);
    // Also send a copy to the business email
    const rawGuest = buildMimeEmail({
      to: booking.guest_email,
      subject,
      html,
      fromName: 'Frensic Luxury Apartment',
    });
    const rawBusiness = buildMimeEmail({
      to: 'info@frensicluxuryapartments.com.ng',
      subject: `[NEW BOOKING] ${booking.item_name} — ${booking.guest_name || booking.guest_email}`,
      html,
      fromName: 'Frensic Luxury Apartment',
    });

    const sendMail = async (raw) => {
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gmail API error: ${err}`);
      }
      return res.json();
    };

    await sendMail(rawGuest);
    // Send business copy — don't fail the whole request if this fails
    sendMail(rawBusiness).catch(() => {});

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});