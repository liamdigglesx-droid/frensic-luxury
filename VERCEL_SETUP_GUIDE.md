# Vercel + Supabase setup

## 1. Supabase credentials

In Supabase Dashboard → Project Settings → API, copy:

| Value | Variable | Exposure |
|---|---|---|
| Project URL | `VITE_SUPABASE_URL` and `SUPABASE_URL` | public / server |
| anon/publishable key | `VITE_SUPABASE_PUBLISHABLE_KEY` | public browser |
| service_role/secret key | `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` | **server only** |

Never create `VITE_SUPABASE_SERVICE_ROLE_KEY`. Anything prefixed with `VITE_` is bundled into browser JavaScript.

## 2. Vercel environment variables

Project Settings → Environment Variables. Add for Production and Preview (and Development if using `vercel dev`):

Public:

```text
VITE_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_PAYSTACK_PUBLIC_KEY=pk_live_... or pk_test_...
```

Server-only (mark sensitive where available):

```text
SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
# Supported alternative instead of SUPABASE_SERVICE_ROLE_KEY:
# SUPABASE_SECRET_KEY=...
PAYSTACK_SECRET_KEY=sk_live_... or sk_test_...
APP_URL=https://YOUR-PRODUCTION-DOMAIN
ADMIN_USERNAME=admin
ADMIN_PASSWORD=long-random-password
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
SLACK_BOT_TOKEN=...        # optional
SLACK_CHANNEL_ID=...       # optional
```

Redeploy after changing environment variables. Preview deployments need their own public Supabase URL/key and server-side Supabase/Paystack values; production-only variables are not inherited by previews.

The API uses one serverless entry (`api/index.js`) and a Vercel rewrite to preserve `/api/<action>` URLs. This keeps the deployment within the Hobby plan function limit. The webhook still receives raw bytes for signature verification; other actions receive bounded parsed JSON.

## 3. Database migrations

From a linked Supabase CLI:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push --include-all
```

Or run the manual **Deploy Supabase Migrations** GitHub workflow with repository secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`

Apply all five migrations in filename order to a fresh environment. Migration `20261106175315_frensic_existing_platform_requests.sql` was recovered from the connected project and is already recorded there. The new `20261106190000_security_and_booking_integrity.sql` adds the security/integrity objects required by the current API, preserves existing catalog values, and normalizes legacy reservation ids. It has already been applied to the user-approved shared project; do not rerun it there. Rehearse future schema changes on an isolated database before applying them to shared data.

## 4. Supabase Auth

Authentication → URL Configuration:

- Site URL: `https://YOUR-PRODUCTION-DOMAIN`
- Redirect URLs:
  - `https://YOUR-PRODUCTION-DOMAIN/login`
  - `https://YOUR-PRODUCTION-DOMAIN/reset-password`
  - `https://YOUR-PRODUCTION-DOMAIN/my-bookings`

Enable the email provider and any OAuth providers you intend to use. Guest booking lookup uses email OTP; password reset uses Supabase recovery links.

For guest OTP delivery, configure custom SMTP under Authentication → Emails. The built-in Supabase sender is restricted to project/team addresses and is not suitable for arbitrary guests. After SMTP is working, review Authentication → Rate Limits; the current shared project still reports the built-in limit of 2 emails/hour.

The current My Bookings form accepts a six-digit code. In the dashboard, set the email OTP length to 6 and include `{{ .Token }}` in both the **Magic Link** and **Confirm signup** templates. A first-time lookup with email confirmation enabled can send the Confirm signup template, so updating only Magic Link is insufficient. For example, add this block to each template while keeping the existing confirmation link if desired:

```html
<p>Your Frensic Luxury verification code is:</p>
<p><strong>{{ .Token }}</strong></p>
<p>Enter this code on the My Bookings page. If you did not request it, ignore this email.</p>
```

These SMTP/template/OTP settings are shared by the connected Supabase project. Coordinate changes with the production owner before applying them; they are not Preview-scoped.

## 5. Paystack

- Use matching test/live public and secret keys.
- Set webhook URL to `https://YOUR-PRODUCTION-DOMAIN/api/paystackWebhook`.
- The webhook must receive the raw request body; the Vercel function disables body parsing for signature verification.
- Client success alone never marks a booking paid. The server verifies amount, currency, reference, and customer email.
- If the staging Preview has Vercel Deployment Protection, create a temporary **Protection Bypass for Automation** secret and append it to the test webhook URL as `?x-vercel-protection-bypass=<secret>`. Use the header form for automated requests. The bypass applies project-wide, so revoke it after staging; never commit it or paste it into chat.

## 6. Google and Slack

Create a Google OAuth client and refresh token with Gmail send and Calendar events access. Store the client ID/secret/refresh token only as server variables. Slack is optional; without it, staff notifications are skipped.

## 7. Verify before pointing the domain

- `npm run check`
- `npm audit --audit-level=high`
- Vercel preview boots without console errors.
- Create a test booking; confirm price is calculated server-side.
- Complete a Paystack test payment; confirm paid status, email, calendar event, and webhook idempotency.
- Submit a bank-transfer receipt; confirm hold expiry and staff receipt access.
- Log in as admin/staff; confirm staff cannot promote themselves and reviews require moderation.
