import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const migrations = [
  'supabase/migrations/20260714000000_initial_schema.sql',
  'supabase/migrations/20260714010000_add_bank_transfer_receipts.sql',
  'supabase/migrations/20260715000000_complete_platform_migration.sql',
  'supabase/migrations/20261106000000_security_and_booking_integrity.sql',
];

async function database() {
  const db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', created_at timestamptz default now());
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
    create function auth.role() returns text language sql stable as $$ select coalesce(auth.jwt() ->> 'role', 'anon') $$;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid, metadata jsonb, created_at timestamptz default now());
  `);
  for (const file of migrations) {
    const sql = readFileSync(file, 'utf8').replace('create extension if not exists pgcrypto;', '-- pgcrypto is provided by Supabase; PGlite has core gen_random_uuid().');
    await db.exec(sql);
  }
  await db.exec(`
    grant usage on schema public, auth, storage to anon, authenticated, service_role;
    grant all on all tables in schema public, storage to anon, authenticated, service_role;
    grant all on all sequences in schema public to anon, authenticated, service_role;
    grant execute on all functions in schema public to anon, authenticated, service_role;
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
