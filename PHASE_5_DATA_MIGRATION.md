# Phase 5: Base44 → Supabase data migration

The current production target is Supabase. If legacy Base44 data still needs to be copied, use the repository function `base44/functions/migrateToSupabase/entry.ts` while the Base44 subscription is active.

## Safe procedure

1. Apply the Supabase migrations first.
2. Configure the migration function with server-side Supabase credentials. Do **not** paste a service-role key into a browser UI or commit it.
3. Invoke the function as a Base44 administrator.
4. The function paginates through source entities in batches instead of stopping at 500 rows.
5. Verify row counts and sample records in Supabase.
6. Run `npm test` and the staging checklist before cutting over traffic.

## Entities copied

- Bookings
- Payment receipts/files where available
- Contact messages
- Rooms and cars
- Reviews
- Admin credential hash

## After migration

- Confirm catalog slugs match the frontend constants (`royal-haven`, `luxe-manor`, etc.).
- Confirm existing paid bookings do not violate the new overlap constraint. The migration includes a guard for pre-existing overlaps; resolve any reported conflicts before relying on availability.
- Rotate any credentials that were shared during manual migration.
- Decommission Base44 only after Vercel/Supabase staging checks pass.
