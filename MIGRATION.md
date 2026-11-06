# Vercel + Supabase cutover

## 1. Apply the database schema

Add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, and `SUPABASE_PROJECT_REF` to GitHub repository secrets, then run **Deploy Supabase Migrations**, or use the Supabase CLI locally:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push --include-all
```

Required migrations, in order:

1. `20260714000000_initial_schema.sql`
2. `20260714010000_add_bank_transfer_receipts.sql`
3. `20260715000000_complete_platform_migration.sql`
4. `20261106175315_frensic_existing_platform_requests.sql` (recovered from the connected project)
5. `20261106190000_security_and_booking_integrity.sql`

Migration 4 was already applied to the connected Supabase project but was missing from this repository; it is now preserved for fresh environments. Migration 5 is required for the current API: booking holds/tokens, receipt metadata, RLS, overlap prevention, role protection, review moderation, rate limits, additive catalog seed, and dashboard statistics. Existing catalog prices/photos are preserved, and legacy UUID-based reservations are mapped to canonical catalog ids before overlap enforcement.

## 2. Transfer existing Base44 data (if still needed)

While the Base44 Builder subscription is active, invoke `migrateToSupabase` once as a Base44 admin. It paginates through bookings, receipts, messages, rooms, cars, reviews, and admin credentials instead of stopping at the first 500 rows.

## 3. Configure Vercel

Import the repository into Vercel and add the variables from `.env.example`. Public variables use `VITE_`; service-role, Paystack secret, admin bootstrap, Google, and Slack values are server-only. See `VERCEL_SETUP_GUIDE.md`.

## 4. Configure Supabase authentication

Set the Site URL to the production URL and add redirect URLs for `/login`, `/reset-password`, and `/my-bookings`. Enable email OTP and any OAuth providers you need.

## 5. Configure Paystack and notifications

Set the Paystack webhook to `/api/paystackWebhook`. Add Google OAuth refresh-token credentials for Gmail/Calendar and optional Slack credentials.

## 6. Cut over

Run `npm run check`, deploy a Vercel preview, and complete the staging checks in `VERCEL_SETUP_GUIDE.md`. Only then point the custom domain to Vercel. Keep Base44 active until production checks pass.
