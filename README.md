# Frensic Luxury — Web App

Premium apartment and automobile rental platform for Abuja, Nigeria.

Live site: [frensicluxuryapartment.com.ng](https://frensicluxuryapartment.com.ng)

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS 3, React Router 7 |
| UI | Radix/shadcn primitives, Framer Motion, TanStack Query |
| Backend | Supabase Postgres/Auth/Storage + one routed Vercel Function (`api/index.js`) |
| Payments | Paystack official `@paystack/inline-js` v2 + server verification/webhook |
| Notifications | Gmail API, Google Calendar API, optional Slack |
| Hosting | Vercel (SPA + serverless API), Supabase (data/auth/storage) |

Legacy Base44 files remain only as a migration/fallback path. Production should run with Supabase configured.

## Local development

Prerequisites: Node.js 22+, npm 10+, a Supabase project, and (for full API testing) the Vercel CLI.

```bash
npm ci
cp .env.example .env.local
# Fill .env.local. Never commit real keys.

# Frontend only:
npm run dev

# Full stack with Vercel Functions (recommended for booking/payment flows):
npx vercel dev
```

The serverless entry dispatches the existing `/api/<action>` URLs internally, keeping Hobby deployments within the function limit. `npm run dev` serves the React app but does not emulate those routes. Use `vercel dev` or a deployed preview when testing booking creation, Paystack verification, receipts, admin login, and notifications.

## Environment variables

See `.env.example` and `VERCEL_SETUP_GUIDE.md`.

Public browser variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_PAYSTACK_PUBLIC_KEY`

Server-only variables (never prefix with `VITE_`):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SECRET_KEY`)
- `PAYSTACK_SECRET_KEY`
- `APP_URL`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`
- optional `SLACK_BOT_TOKEN`, `SLACK_CHANNEL_ID`

The service-role key bypasses Row Level Security and must only exist in server environments.

## Scripts

```bash
npm run dev        # Vite frontend
npm run build      # Production build -> dist/
npm run preview    # Preview dist/ (no serverless API emulation)
npm run lint       # ESLint (errors only)
npm run lint:fix   # ESLint autofix
npm run typecheck  # TypeScript checkJs over application code
npm test           # Node test runner: API security, PGlite migrations/RLS, jsdom boot/router/Paystack
npm run check      # lint + typecheck + test + build
```

Run `npm run check` and `npm audit --audit-level=high` before committing.

## Deployment

1. Apply Supabase migrations (`supabase db push --include-all` or the manual GitHub workflow).
2. Import the repository into Vercel.
3. Add the public variables to Vercel as ordinary environment variables and the server-only variables as **sensitive/server** variables. Do not expose server keys to the browser.
4. Set Supabase Auth Site URL and redirect URLs to the production domain (`/login`, `/reset-password`, `/my-bookings`).
5. Configure the Paystack webhook URL: `https://YOUR-DOMAIN/api/paystackWebhook`.
6. Deploy from Vercel. GitHub Actions runs CI; it no longer FTP-deploys a static bundle because the app requires serverless API routes.

## Booking and payment flow

1. Guest selects a room/car and dates.
2. `/api/checkAvailability` and `/api/createBooking` validate dates, capacity, chauffeur rules, and server-side pricing. The browser cannot set the final price or payment status.
3. Paystack checkout uses a server-generated reference. `/api/verifyPayment` and the signed `/api/paystackWebhook` confirm the exact amount/currency/reference before marking a booking paid.
4. Bank-transfer bookings create a short-lived hold and use signed receipt upload URLs.
5. Paid bookings trigger idempotent confirmation email, calendar event, and optional Slack notification.
6. Guests retrieve their own bookings through email OTP or a session-scoped booking capability token.

## Database integrity and access control

The security migration adds:

- RLS policies for bookings, profiles, catalog, reviews, messages, and receipts.
- A trigger preventing overlapping paid bookings and active checkout holds.
- Role-escalation protection for profiles.
- Pending-by-default review moderation.
- Atomic API rate limits.
- Aggregate `booking_stats` RPC for staff dashboards.

## Tests

`npm test` runs without live credentials:

- `tests/api-security.test.mjs`: mocked Supabase/external services; authorization, pricing, payment verification, webhook signatures, notification idempotency, review moderation.
- `tests/database.test.mjs`: PGlite executes the real migrations, including the recovered platform RPCs, and checks RLS, overlap/hold triggers, legacy catalog/id compatibility, role protection, and rate limits.
- `tests/frontend.test.mjs`: jsdom boots the real bundle, exercises React Router 7 routes, safe redirects, guest token storage, and the Paystack SDK wrapper.

Live Paystack, Gmail, Calendar, Slack, Supabase Auth email delivery, and Vercel routing still require a staging smoke test with real credentials.
