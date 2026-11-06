# Migration verification checklist

Use this checklist after applying the Supabase migrations and configuring Vercel.

## 1. Environment variables

Checked boxes below refer to the shared staging/Preview environment only, not production cutover readiness.

- [x] `VITE_SUPABASE_URL` is set.
- [x] `VITE_SUPABASE_PUBLISHABLE_KEY` is set.
- [ ] `VITE_PAYSTACK_PUBLIC_KEY` is set.
- [x] `SUPABASE_URL` is set as a server variable.
- [x] A server-only Supabase privileged key is set (`SUPABASE_SECRET_KEY` on Preview; `SUPABASE_SERVICE_ROLE_KEY` is also supported by the API).
- [x] No variable named `VITE_SUPABASE_SERVICE_ROLE_KEY` exists in the verified Preview deployment.
- [ ] `PAYSTACK_SECRET_KEY`, `ADMIN_PASSWORD`, Google, and optional Slack variables are set on the server. `APP_URL` and `ADMIN_USERNAME` are already present on Preview.

## 2. Database

- [x] All five migrations applied successfully in filename order.
- [x] The recovered `20261106175315_frensic_existing_platform_requests` migration is present in history.
- [x] Existing catalog prices/photos were preserved and legacy reservation ids were normalized.
- [x] `public.rooms` and `public.cars` contain active catalog rows.
- [x] `public.booking_stats` exists and is executable only by `service_role`.
- [x] Anonymous users cannot insert bookings or read pending reviews (rolled-back shared-database smoke).
- [x] Staff cannot change their own profile role to admin (automated database test).

## 3. Deployment

- [x] Vercel build succeeds.
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

- [x] Lint passes.
- [x] Typecheck passes.
- [x] API/database/frontend tests pass (22/22).
- [x] Production build passes.
- [x] No high/critical npm audit findings.

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

### Setup continuation — 2026-11-06

- Rebuilt the branch Preview as `dpl_7hJARwDRwcVRHNsnnCMyVDcqnTAL` from `996262f9fe2fa7f6d1e1f298637002894f48f8cf`. It is `READY`/`STAGED`, has the single `api/index.js` function, and is assigned to `https://frensic-luxury-git-arena-240-7a33ab-liamdigglesx-6720s-projects.vercel.app`. Production was not promoted.
- Build logs confirm a fresh `vite build` after restoring the dependency/build cache. The deployment environment now includes `APP_URL` and `ADMIN_USERNAME` alongside the Supabase variables.
- Verified absent from that deployment: `VITE_PAYSTACK_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`, `ADMIN_PASSWORD`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `SLACK_BOT_TOKEN`, and `SLACK_CHANNEL_ID`. No placeholder credentials were created and no secret values were decrypted or recorded.
- Added the exact apex and `www` production origins to the Supabase Auth redirect allowlist while preserving all existing entries. A follow-up read confirmed the site URL, SMTP settings, OTP length, email rate limit, and templates were unchanged. This is an allowlist addition, not a domain cutover.
- Read-only database check: 19 bookings, 3 rooms, 7 car rows, 4 reviews, 5 migrations, 0 stored admin credentials, and 0 bookings labeled `STAGING TEST`.
- Anonymous access to the new Preview still returns Vercel SSO protection, so browser/API live smoke has not been run. The local gate passed again: lint, typecheck, 22/22 tests, build, and `npm audit --audit-level=high` with 0 findings.
- Dashboard-only blockers remain: matching Paystack test keys and webhook, `ADMIN_PASSWORD`, custom Supabase SMTP, six-digit OTP plus `{{ .Token }}` in the Magic Link and Confirm signup templates, Google OAuth credentials, optional Slack credentials, and a temporary automation-bypass secret for protected-preview testing. Do not change the shared admin password or rerun applied migrations during staging.
