# Vercel + Supabase cutover

## 1. Apply the database schema
Add `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` to the GitHub repository secrets, then run **Deploy Supabase Migrations** from GitHub Actions.

## 2. Transfer existing Base44 data
While the Base44 Builder subscription is active, invoke `migrateToSupabase` once while signed in as a Base44 admin. It copies bookings, payment receipts, messages, rooms, cars, reviews, and the current admin password hash.

## 3. Configure Vercel
Import the GitHub repository into Vercel and add every variable listed in `.env.example`. The Supabase URL is already listed; copy the publishable and service-role keys from Supabase project settings.

Google email/calendar require an OAuth client ID, client secret, and refresh token. Slack requires a bot token. Add the production URL as `APP_URL`.

## 4. Configure Supabase authentication
Set the Site URL to the Vercel production URL and add these redirect URLs:
- `https://YOUR-DOMAIN/login`
- `https://YOUR-DOMAIN/reset-password`
- `https://YOUR-DOMAIN/**`

Enable Google login in Supabase if Google sign-in should remain available.

## 5. Cut over
Deploy from Vercel, confirm bookings and admin access, then point the custom domain to Vercel. Keep Base44 active until the production checks pass.