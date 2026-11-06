# Migration verification checklist

Use this checklist after applying the Supabase migrations and configuring Vercel.

## 1. Environment variables

- [ ] `VITE_SUPABASE_URL` is set.
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` is set.
- [ ] `VITE_PAYSTACK_PUBLIC_KEY` is set.
- [ ] `SUPABASE_URL` is set as a server variable.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set as a **server-only** variable.
- [ ] No variable named `VITE_SUPABASE_SERVICE_ROLE_KEY` exists.
- [ ] `PAYSTACK_SECRET_KEY`, `APP_URL`, admin bootstrap, Google, and optional Slack variables are set on the server.

## 2. Database

- [ ] All five migrations applied successfully in filename order.
- [ ] The recovered `20261106175315_frensic_existing_platform_requests` migration is present in history.
- [ ] Existing catalog prices/photos were preserved and legacy reservation ids were normalized.
- [ ] `public.rooms` and `public.cars` contain active catalog rows.
- [ ] `public.booking_stats` exists and is executable only by `service_role`.
- [ ] Anonymous users cannot insert bookings or read pending reviews.
- [ ] Staff cannot change their own profile role to admin.

## 3. Deployment

- [ ] Vercel build succeeds.
- [ ] `/` boots without console errors.
- [ ] `/rooms`, `/cars`, `/book`, `/login`, `/my-bookings`, and `/dashboard/admin` route correctly.
- [ ] `/api/data` rejects anonymous private booking reads/updates through the single-function rewrite.
- [ ] Unknown `/api/<action>` routes return 404 and invalid JSON returns 400.
- [ ] SPA refreshes on deep links do not return 404.

## 4. Booking and payment staging checks

- [ ] Availability rejects overlapping dates.
- [ ] Booking creation ignores client-supplied prices and returns a server total.
- [ ] Paystack test payment succeeds only after server verification.
- [ ] Paystack webhook signature failures return 401.
- [ ] Replaying verification/webhook does not duplicate email/calendar notifications.
- [ ] Bank-transfer receipt upload uses a signed URL and respects the hold window.
- [ ] Guest booking lookup requires email OTP or the session booking token.

## 5. Admin/staff checks

- [ ] Admin login works with the bootstrap credentials and then stored hash.
- [ ] Staff can manage bookings/messages/reviews but cannot manage staff roles.
- [ ] Reviews are hidden publicly until approved.
- [ ] Dashboard totals use the aggregate RPC, not a capped client list.

## 6. Automated gate

```bash
npm run check
npm audit --audit-level=high
```

- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] API/database/frontend tests pass.
- [ ] Production build passes.
- [ ] No high/critical npm audit findings.

## Shared staging verification log — 2026-11-06

Target: user-approved shared Supabase project `jhgaoemlwjradmufigyh`; Vercel preview only. Production deployment was not promoted.

- Pre-migration logical snapshot: schema `frensic_pre_security_20261106` with copies of `admin_credentials`, `bookings`, `cars`, `contact_messages`, `profiles`, `reviews`, `rooms`, the `payment-receipts` bucket metadata, receipt object metadata, and a row-count manifest. Anonymous/authenticated access was revoked.
- Applied `20261106190000_security_and_booking_integrity` transactionally and recorded it in migration history. The project now has all five migrations.
- Verified after apply: 19 bookings preserved; existing room/car names and prices unchanged; 4 reviews preserved; catalog slugs/active flags present; historical booking item ids canonicalized.
- Rolled-back database smoke passed: anonymous catalog/approved-review reads, anonymous booking reads hidden, anonymous booking inserts denied, rate-limit window, aggregate stats privilege, paid-overlap rejection, and active-hold overlap rejection.
- Verified privileges: `consume_rate_limit` and `booking_stats` are service-role-only; the legacy booking RPC is authenticated-only.
- Verified receipt bucket remains private with the 50 MB limit and JPEG/PNG/WebP/PDF MIME allowlist.
- Preview-only Vercel variables added: `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Supabase Auth redirect allowlist updated for `frensic-luxury-*` preview origins.
- Still pending: protected-preview browser/API smoke, Paystack test charge/webhook, Gmail/Calendar/Slack delivery, Supabase SMTP/auth email delivery, and admin bootstrap verification.
