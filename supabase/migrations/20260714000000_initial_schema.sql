create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'staff', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'staff')
  );
$$;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_type text not null check (booking_type in ('stay', 'drive')),
  item_id text,
  item_name text,
  start_date date not null,
  end_date date not null,
  guest_name text,
  guest_email text not null,
  guest_phone text,
  guests_count integer check (guests_count > 0),
  chauffeur boolean not null default false,
  special_requests text,
  nights_or_days integer check (nights_or_days > 0),
  unit_price numeric(14, 2),
  total_amount numeric(14, 2) not null check (total_amount >= 0),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed')),
  payment_reference text unique,
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date > start_date)
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  message text not null,
  legacy_id text unique,
  created_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text,
  description text,
  price_per_night numeric(14, 2) not null,
  bedrooms integer,
  size_sqm integer,
  max_guests integer,
  amenities text[] not null default '{}',
  image_url text,
  gallery text[] not null default '{}',
  featured boolean not null default false,
  display_order integer not null default 0,
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  style text,
  description text,
  price_per_day numeric(14, 2) not null,
  horsepower integer,
  top_speed text,
  seats integer,
  transmission text,
  features text[] not null default '{}',
  image_url text,
  gallery text[] not null default '{}',
  chauffeur_available boolean not null default true,
  display_order integer not null default 0,
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  guest_title text,
  headline text,
  body text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  avatar_url text,
  service_type text check (service_type in ('stay', 'drive')),
  display_order integer not null default 0,
  legacy_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_guest_email_idx on public.bookings (lower(guest_email));
create index bookings_dates_idx on public.bookings (start_date, end_date);
create index bookings_payment_status_idx on public.bookings (payment_status);
create index contact_messages_created_at_idx on public.contact_messages (created_at desc);

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings
for each row execute function public.set_updated_at();
create trigger rooms_set_updated_at before update on public.rooms
for each row execute function public.set_updated_at();
create trigger cars_set_updated_at before update on public.cars
for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.rooms enable row level security;
alter table public.cars enable row level security;
alter table public.reviews enable row level security;

create policy "Users read own profile" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "Admins manage profiles" on public.profiles
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public creates pending bookings" on public.bookings
for insert to anon, authenticated
with check (payment_status = 'pending' and payment_reference is null);
create policy "Admins manage bookings" on public.bookings
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public sends contact messages" on public.contact_messages
for insert to anon, authenticated with check (true);
create policy "Admins manage contact messages" on public.contact_messages
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public reads rooms" on public.rooms
for select to anon, authenticated using (true);
create policy "Admins manage rooms" on public.rooms
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public reads cars" on public.cars
for select to anon, authenticated using (true);
create policy "Admins manage cars" on public.cars
for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Public reads reviews" on public.reviews
for select to anon, authenticated using (true);
create policy "Public submits reviews" on public.reviews
for insert to anon, authenticated with check (rating between 1 and 5);
create policy "Admins manage reviews" on public.reviews
for all to authenticated using (public.is_admin()) with check (public.is_admin());