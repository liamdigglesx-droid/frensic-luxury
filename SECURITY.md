# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately to the repository owner/administrator. Do not open a public issue containing exploit details, guest personal data, payment references, or credentials. Include reproduction steps, affected routes/endpoints, and impact. The maintainers will triage and respond as soon as possible.

## Security model

- Browser code uses only the Supabase publishable/anon key. Service-role and payment/notification secrets live in server environment variables.
- Booking prices, payment status, receipt validation, and staff notifications are controlled by Vercel Functions, not the client.
- Paystack payments require server-side transaction verification and a signed webhook.
- Supabase RLS restricts guest booking reads to verified email ownership; staff/admin access is role-based.
- Profile role changes are protected against self-escalation.
- Reviews are pending until staff moderation.
- API rate limits are enforced in Postgres.
- Guest booking capability tokens are stored in session storage and sent as `x-booking-token`.

## Operational requirements

- Rotate any key that may have been exposed.
- Never prefix secret keys with `VITE_`.
- Apply all Supabase migrations before deploying the matching API code.
- Run `npm run check` and `npm audit --audit-level=high` in CI.
- Use HTTPS for production and Supabase Auth redirect URLs.
