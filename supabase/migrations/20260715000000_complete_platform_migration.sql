alter table public.bookings
  add column if not exists booking_status text not null default 'pending' check (booking_status in ('pending','confirmed','checked_in','completed','cancelled')),
  add column if not exists assigned_staff_id uuid references auth.users(id) on delete set null,
  add column if not exists assigned_staff_name text,
  add column if not exists assigned_staff_email text;

create table if not exists public.admin_credentials (
  id uuid primary key default gen_random_uuid(),
  password_hash text not null,
  salt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_credentials enable row level security;
create policy "No public admin credential access" on public.admin_credentials for all using (false) with check (false);
create trigger admin_credentials_set_updated_at before update on public.admin_credentials for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-receipts', 'payment-receipts', false, 52428800, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Customers upload receipts" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'payment-receipts');
create policy "Staff read receipts" on storage.objects for select to authenticated
using (bucket_id = 'payment-receipts' and public.is_admin());
create policy "Staff manage receipts" on storage.objects for all to authenticated
using (bucket_id = 'payment-receipts' and public.is_admin()) with check (bucket_id = 'payment-receipts' and public.is_admin());