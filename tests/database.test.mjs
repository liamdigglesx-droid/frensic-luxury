import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const migrations = [
  'supabase/migrations/20260714000000_initial_schema.sql',
  'supabase/migrations/20260714010000_add_bank_transfer_receipts.sql',
  'supabase/migrations/20260715000000_complete_platform_migration.sql',
  'supabase/migrations/20261106175315_frensic_existing_platform_requests.sql',
  'supabase/migrations/20261106190000_security_and_booking_integrity.sql',
];

async function database({ beforeSecurity } = {}) {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select coalesce(auth.jwt() ->> 'role', 'anon') $$;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, metadata jsonb, created_at timestamptz default now());
  `);
  for (const file of migrations) {
    if (file.includes('20261106190000') && beforeSecurity) await beforeSecurity(db);
    const sql = readFileSync(file, 'utf8').replace('create extension if not exists pgcrypto;', '-- pgcrypto is provided by Supabase; PGlite has core gen_random_uuid().');
    await db.exec(sql);
  }
  await db.exec(`
    grant usage on schema public, auth, storage to anon, authenticated, service_role;
    grant all on all tables in schema public, storage to anon, authenticated, service_role;
    grant all on all sequences in schema public to anon, authenticated, service_role;
    insert into auth.users (id, email, raw_user_meta_data) values
      ('00000000-0000-0000-0000-000000000001', 'admin@example.com', '{"full_name":"Admin"}'),
      ('00000000-0000-0000-0000-000000000002', 'staff@example.com', '{"full_name":"Staff"}'),
      ('00000000-0000-0000-0000-000000000003', 'guest@example.com', '{"full_name":"Guest"}');
    select set_config('request.jwt.claims', '{"role":"service_role"}', false);
    update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000000001';
    update public.profiles set role='staff' where id='00000000-0000-0000-0000-000000000002';
  `);
  return db;
}
const claims = (sub, role, email) => `select set_config('request.jwt.claims', '${JSON.stringify({ sub, role, email })}', false); set role ${role};`;
test('migrations apply and enforce reservation overlaps', async () => {
  const db = await database();
  await db.exec(claims('00000000-0000-0000-0000-000000000001', 'service_role', 'admin@example.com'));
  await db.exec(`insert into public.bookings (booking_type,item_id,item_name,start_date,end_date,guest_email,total_amount,payment_status) values ('stay','royal-haven','Royal Haven','2026-12-01','2026-12-03','guest@example.com',500000,'paid');`);
  await assert.rejects(
    db.exec(`insert into public.bookings (booking_type,item_id,item_name,start_date,end_date,guest_email,total_amount,payment_status) values ('stay','royal-haven','Royal Haven','2026-12-02','2026-12-04','other@example.com',500000,'paid');`),
    /conflict/i,
  );
  await db.exec(`insert into public.bookings (booking_type,item_id,item_name,start_date,end_date,guest_email,total_amount,payment_status,hold_expires_at) values ('stay','royal-haven','Royal Haven','2026-12-02','2026-12-04','other@example.com',500000,'pending',now() - interval '1 minute');`);
  const rows = await db.query(`select count(*)::int as count from public.bookings where item_id='royal-haven'`);
  assert.equal(rows.rows[0].count, 2);
  await db.close();
});

test('active checkout holds block overlapping bookings until they expire', async () => {
  const db = await database();
  await db.exec(claims('00000000-0000-0000-0000-000000000001', 'service_role', 'admin@example.com'));
  await db.exec(`insert into public.bookings (booking_type,item_id,item_name,start_date,end_date,guest_email,total_amount,payment_status,payment_method,hold_expires_at) values ('stay','royal-haven','Royal Haven','2026-12-01','2026-12-03','guest@example.com',500000,'pending','paystack',now() + interval '20 minutes');`);
  await assert.rejects(db.exec(`insert into public.bookings (booking_type,item_id,item_name,start_date,end_date,guest_email,total_amount,payment_status) values ('stay','royal-haven','Royal Haven','2026-12-02','2026-12-04','other@example.com',500000,'paid');`), /conflict/i);
  await db.exec(`update public.bookings set hold_expires_at = now() - interval '1 minute' where payment_status='pending';`);
  await db.exec(`insert into public.bookings (booking_type,item_id,item_name,start_date,end_date,guest_email,total_amount,payment_status) values ('stay','royal-haven','Royal Haven','2026-12-02','2026-12-04','other@example.com',500000,'paid');`);
  await db.close();
});

test('staff cannot escalate their own role, administrators can', async () => {
  const db = await database();
  await db.exec(claims('00000000-0000-0000-0000-000000000002', 'authenticated', 'staff@example.com'));
  await assert.rejects(db.exec(`update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000000002';`), /administrators/i);
  await db.exec(claims('00000000-0000-0000-0000-000000000001', 'authenticated', 'admin@example.com'));
  await db.exec(`update public.profiles set role='admin' where id='00000000-0000-0000-0000-000000000002';`);
  const result = await db.query(`select role from public.profiles where id='00000000-0000-0000-0000-000000000002'`);
  assert.equal(result.rows[0].role, 'admin');
  await db.close();
});

test('RLS hides pending reviews and exposes only a guest’s own bookings', async () => {
  const db = await database();
  await db.exec(claims('00000000-0000-0000-0000-000000000001', 'service_role', 'admin@example.com'));
  await db.exec(`
    insert into public.reviews (guest_name,body,rating,status) values ('A','pending',5,'pending'),('B','approved',5,'approved');
    insert into public.bookings (booking_type,item_id,item_name,start_date,end_date,guest_email,total_amount,payment_status) values
      ('stay','royal-haven','Royal Haven','2026-12-01','2026-12-02','guest@example.com',250000,'paid'),
      ('stay','luxe-manor','Luxe Manor','2026-12-01','2026-12-02','other@example.com',400000,'paid');
  `);
  await db.exec(claims(null, 'anon', null));
  const reviews = await db.query(`select body from public.reviews`);
  assert.deepEqual(reviews.rows.map(row => row.body), ['approved']);
  await db.exec(claims('00000000-0000-0000-0000-000000000003', 'authenticated', 'guest@example.com'));
  const bookings = await db.query(`select guest_email from public.bookings`);
  assert.deepEqual(bookings.rows.map(row => row.guest_email), ['guest@example.com']);
  await assert.rejects(db.exec(`insert into public.bookings (booking_type,item_id,start_date,end_date,guest_email,total_amount,payment_status) values ('stay','royal-haven','2027-01-01','2027-01-02','guest@example.com',1,'pending');`), /row-level security/i);
  await db.close();
});

test('database rate limit is atomic and resets after the window', async () => {
  const db = await database();
  await db.exec(claims(null, 'service_role', null));
  const call = () => db.query(`select public.consume_rate_limit('test-key', 2, 60) as allowed`);
  assert.equal((await call()).rows[0].allowed, true);
  assert.equal((await call()).rows[0].allowed, true);
  assert.equal((await call()).rows[0].allowed, false);
  await db.exec(`update public.api_rate_limits set window_start = now() - interval '61 seconds' where key='test-key';`);
  assert.equal((await call()).rows[0].allowed, true);
  await db.close();
});

test('security migration preserves live catalog prices and canonicalizes legacy reservations', async () => {
  const roomId = '10000000-0000-0000-0000-000000000001';
  const carId = '10000000-0000-0000-0000-000000000002';
  const db = await database({ beforeSecurity: async client => {
    await client.exec(`
      insert into public.rooms (id,name,legacy_id,price_per_night,max_guests) values ('${roomId}','Royal Haven','legacy-room',999000,6);
      insert into public.cars (id,name,legacy_id,price_per_day,seats) values ('${carId}','Luxurious Style','legacy-car',123000,4);
      insert into public.bookings (booking_type,item_id,item_name,start_date,end_date,guest_email,total_amount,payment_status,booking_status)
      values ('stay','${roomId}','Royal Haven','2030-01-10','2030-01-12','guest@example.com',1998000,'paid','confirmed');
    `);
  } });
  const room = await db.query(`select slug, price_per_night from public.rooms where id='${roomId}'`);
  assert.equal(room.rows[0].slug, 'royal-haven');
  assert.equal(Number(room.rows[0].price_per_night), 999000);
  const car = await db.query(`select slug, price_per_day from public.cars where id='${carId}'`);
  assert.equal(car.rows[0].slug, 'luxurious-style');
  assert.equal(Number(car.rows[0].price_per_day), 123000);
  const booking = await db.query(`select item_id from public.bookings where item_name='Royal Haven' and payment_status='paid'`);
  assert.equal(booking.rows[0].item_id, 'royal-haven');
  await db.exec(claims(null, 'service_role', null));
  await assert.rejects(db.exec(`insert into public.bookings (booking_type,item_id,item_name,start_date,end_date,guest_email,total_amount,payment_status) values ('stay','royal-haven','Royal Haven','2030-01-11','2030-01-13','other@example.com',1,'paid');`), /conflict/i);
  assert.equal((await db.query('select count(*)::int as count from public.rooms')).rows[0].count, 3);
  assert.equal((await db.query('select count(*)::int as count from public.cars')).rows[0].count, 7);
  await db.close();
});

test('recovered platform RPCs and privileged statistics are not executable by anonymous callers', async () => {
  const db = await database();
  const result = await db.query(`
    select has_function_privilege('anon', 'public.frensic_request_booking(uuid,date,date,integer,text)', 'EXECUTE') as booking_rpc,
           has_function_privilege('anon', 'public.frensic_send_contact(text,text,text,text)', 'EXECUTE') as contact_rpc,
           has_function_privilege('anon', 'public.booking_stats(integer)', 'EXECUTE') as stats_rpc,
           has_function_privilege('anon', 'public.consume_rate_limit(text,integer,integer)', 'EXECUTE') as rate_rpc,
           has_function_privilege('authenticated', 'public.frensic_request_booking(uuid,date,date,integer,text)', 'EXECUTE') as authenticated_booking_rpc;
  `);
  assert.deepEqual(result.rows[0], { booking_rpc: false, contact_rpc: false, stats_rpc: false, rate_rpc: false, authenticated_booking_rpc: true });
  await db.close();
});
