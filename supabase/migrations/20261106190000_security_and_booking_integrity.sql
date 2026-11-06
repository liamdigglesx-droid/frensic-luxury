-- Security, payment integrity, moderated reviews, and reservation holds.
begin;

alter table public.bookings
  add column if not exists guest_access_hash text,
  add column if not exists hold_expires_at timestamptz,
  add column if not exists payment_verified_at timestamptz,
  add column if not exists payment_verified_by text,
  add column if not exists calendar_event_id text,
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists receipt_notification_sent_at timestamptz,
  add column if not exists slack_notified_at timestamptz,
  add column if not exists receipt_upload_path text;

alter table public.rooms add column if not exists slug text, add column if not exists active boolean not null default true;
alter table public.cars add column if not exists slug text, add column if not exists active boolean not null default true;
create unique index if not exists rooms_slug_key on public.rooms(slug);
create unique index if not exists cars_slug_key on public.cars(slug);
alter table public.reviews add column if not exists status text not null default 'approved' check (status in ('pending','approved','rejected'));
alter table public.reviews alter column status set default 'pending';
alter table public.admin_credentials add column if not exists iterations integer not null default 120000;

create index if not exists bookings_hold_expiry_idx on public.bookings(hold_expires_at);
create index if not exists bookings_item_dates_idx on public.bookings(item_id, start_date, end_date);
create index if not exists reviews_status_idx on public.reviews(status);

create table if not exists public.api_rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now()
);
alter table public.api_rate_limits enable row level security;

create or replace function public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare allowed boolean;
begin
  if p_limit < 1 or p_window_seconds < 1 then return false; end if;
  delete from public.api_rate_limits where window_start < now() - interval '2 days';
  insert into public.api_rate_limits as limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case when limits.window_start < now() - make_interval(secs => p_window_seconds) then 1 else limits.count + 1 end,
    window_start = case when limits.window_start < now() - make_interval(secs => p_window_seconds) then now() else limits.window_start end
  returning (count <= p_limit) into allowed;
  return allowed;
end;
$$;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('admin','staff'));
$$;

create or replace function public.protect_profile_role()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.id is distinct from old.id then raise exception 'Profile id cannot be changed'; end if;
  if new.role is distinct from old.role and not (public.is_admin() or auth.role() = 'service_role') then
    raise exception 'Only administrators can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role before update on public.profiles for each row execute function public.protect_profile_role();

create or replace function public.enforce_booking_availability()
returns trigger language plpgsql security definer set search_path = '' as $$
declare conflict_count integer;
begin
  if new.booking_status = 'cancelled' then return new; end if;
  if not (
    new.payment_status = 'paid'
    or (new.payment_status = 'pending' and new.hold_expires_at is not null and new.hold_expires_at > now() and coalesce(new.transfer_status, '') <> 'expired')
  ) then return new; end if;
  perform pg_advisory_xact_lock(hashtext(new.item_id));
  select count(*) into conflict_count from public.bookings b
  where b.id <> new.id and b.item_id = new.item_id and b.booking_status <> 'cancelled'
    and b.start_date < new.end_date and b.end_date > new.start_date
    and (b.payment_status = 'paid' or (b.payment_status = 'pending' and b.hold_expires_at is not null and b.hold_expires_at > now() and coalesce(b.transfer_status, '') <> 'expired'));
  if conflict_count > 0 then raise exception 'Selected dates conflict with another reservation' using errcode = '23P01'; end if;
  return new;
end;
$$;

-- Replace permissive legacy policies.
drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Admins manage profiles" on public.profiles;
drop policy if exists "Public creates pending bookings" on public.bookings;
drop policy if exists "Admins manage bookings" on public.bookings;
drop policy if exists "Public sends contact messages" on public.contact_messages;
drop policy if exists "Admins manage contact messages" on public.contact_messages;
drop policy if exists "Public reads rooms" on public.rooms;
drop policy if exists "Admins manage rooms" on public.rooms;
drop policy if exists "Public reads cars" on public.cars;
drop policy if exists "Admins manage cars" on public.cars;
drop policy if exists "Public reads reviews" on public.reviews;
drop policy if exists "Public submits reviews" on public.reviews;
drop policy if exists "Admins manage reviews" on public.reviews;
drop policy if exists "Customers upload receipts" on storage.objects;
drop policy if exists "Staff read receipts" on storage.objects;
drop policy if exists "Staff manage receipts" on storage.objects;

create policy "Profiles read own or staff" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());
create policy "Profiles update own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "Admins manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Guests read own bookings" on public.bookings for select to authenticated using (lower(guest_email) = lower(auth.jwt() ->> 'email'));
create policy "Staff manage bookings" on public.bookings for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage messages" on public.contact_messages for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Public reads active rooms" on public.rooms for select to anon, authenticated using (active = true);
create policy "Admins manage rooms" on public.rooms for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads active cars" on public.cars for select to anon, authenticated using (active = true);
create policy "Admins manage cars" on public.cars for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Public reads approved reviews" on public.reviews for select to anon, authenticated using (status = 'approved');
create policy "Staff manage reviews" on public.reviews for all to authenticated using (public.is_staff()) with check (public.is_staff());
create policy "Staff read receipts" on storage.objects for select to authenticated using (bucket_id = 'payment-receipts' and public.is_staff());
create policy "Staff manage receipts" on storage.objects for all to authenticated using (bucket_id = 'payment-receipts' and public.is_staff()) with check (bucket_id = 'payment-receipts' and public.is_staff());

-- Catalog seed generated from src/lib/constants.js
-- Prefer stable migrated Base44 ids when attaching canonical slugs. Names are
-- only a fallback for legacy rows that did not retain their source id.
with seed(slug,legacy_id) as (values
('royal-haven','6a553b3a9433189426da41ca'),
('majestic-deluxe','6a553b3a9433189426da41cb'),
('luxe-manor','6a553b3a9433189426da41cc')
) update public.rooms r set slug=seed.slug from seed where r.slug is null and r.legacy_id=seed.legacy_id;
with seed(slug,legacy_id) as (values
('luxurious-style','6a553b3a9997e53e45ea7efd'),
('premium-style','6a553b3a9997e53e45ea7efe'),
('elegant-style','6a553b3a9997e53e45ea7eff')
) update public.cars c set slug=seed.slug from seed where c.slug is null and c.legacy_id=seed.legacy_id;
with seed(slug,name,price) as (values
('royal-haven','Royal Haven',250000),
('majestic-deluxe','The Majestic Deluxe',350000),
('luxe-manor','The Luxe Manor',400000)
) update public.rooms r set slug=seed.slug from seed where r.slug is null and lower(r.name)=lower(seed.name);
with seed(slug,name,price) as (values
('luxurious-style','Luxurious Style',80000),
('premium-style','Premium Style',80000),
('elegant-style','Elegant Style',100000),
('presidential-style','Presidential Style',120000),
('grand-style','Grand Style',120000),
('royal-style','Royal Style',150000),
('phenomenal','Phenomenal',200000)
) update public.cars c set slug=seed.slug from seed where c.slug is null and lower(c.name)=lower(seed.name);
insert into public.rooms (slug,name,tagline,description,price_per_night,bedrooms,size_sqm,max_guests,amenities,image_url,gallery,featured,display_order,active) values ('royal-haven','Royal Haven','Family Suite','A spacious, family-friendly suite with three bedrooms and a bright living area, perfect for families or groups seeking a comfortable retreat in Abuja.',250000,3,250,6,array['High-Speed WiFi','Smart TV','Swimming Pool','Netflix','Air Conditioning','Daily Housekeeping']::text[],'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/d7450e02f_generated_21bb45e6.png',array[]::text[],false,0,true) on conflict (slug) do nothing;
insert into public.rooms (slug,name,tagline,description,price_per_night,bedrooms,size_sqm,max_guests,amenities,image_url,gallery,featured,display_order,active) values ('majestic-deluxe','The Majestic Deluxe','Executive Suite','A luxurious room with an atmosphere oozing comfort and tranquility. Sharing a blend of luxury modern furnishings with panoramic city views.',350000,4,320,8,array['High-Speed WiFi','Smart TV','Rooftop Pool','Gourmet Kitchen','24/7 Concierge','Private Terrace']::text[],'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/ef518f0ee_generated_210486c6.png',array[]::text[],false,1,true) on conflict (slug) do nothing;
insert into public.rooms (slug,name,tagline,description,price_per_night,bedrooms,size_sqm,max_guests,amenities,image_url,gallery,featured,display_order,active) values ('luxe-manor','The Luxe Manor','Premium Suite','The ultimate luxury living experience offering a blend of modern aesthetics and timeless elegance. Our most exclusive residence.',400000,5,450,10,array['High-Speed WiFi','Smart TV','Private Pool','Full Kitchen','Home Gym','Personal Butler','Private Cinema']::text[],'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/556ba3447_generated_e98d5d1f.png',array[]::text[],false,2,true) on conflict (slug) do nothing;
insert into public.cars (slug,name,style,description,price_per_day,horsepower,top_speed,seats,transmission,features,image_url,gallery,chauffeur_available,display_order,active) values ('luxurious-style','Luxurious Style','Sports Coupe','Experience the thrill of pure performance. This sports coupe delivers breathtaking acceleration and handles with surgical precision—for business or pure pleasure.',80000,650,'320 km/h',4,'Automatic',array['Chauffeur Available','GPS Navigation','Premium Sound System','Leather Interior','Climate Control']::text[],'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/ad6539448_generated_e8ef4aa2.png',array[]::text[],true,0,true) on conflict (slug) do nothing;
insert into public.cars (slug,name,style,description,price_per_day,horsepower,top_speed,seats,transmission,features,image_url,gallery,chauffeur_available,display_order,active) values ('premium-style','Premium Style','Executive Sedan','Premium performance meets executive refinement. Offering top-tier luxury features and special promotions, perfect for business travel and special occasions.',80000,450,'280 km/h',5,'Automatic',array['Chauffeur Available','GPS Navigation','Massage Seats','Ambient Lighting','Air Suspension']::text[],'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/8930a48a6_generated_66061811.png',array[]::text[],true,1,true) on conflict (slug) do nothing;
insert into public.cars (slug,name,style,description,price_per_day,horsepower,top_speed,seats,transmission,features,image_url,gallery,chauffeur_available,display_order,active) values ('elegant-style','Elegant Style','Luxury SUV','The top-of-the-line SUV with exceptional reliability and commanding presence. Perfect for families, airport transfers, and VIP transportation.',100000,500,'260 km/h',7,'Automatic',array['Chauffeur Available','GPS Navigation','Premium Bose Sound','Panoramic Roof','Air Suspension','Night Vision']::text[],'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/6e5a5ceee_generated_3119a26d.png',array[]::text[],true,2,true) on conflict (slug) do nothing;
insert into public.cars (slug,name,style,description,price_per_day,horsepower,top_speed,seats,transmission,features,image_url,gallery,chauffeur_available,display_order,active) values ('presidential-style','Presidential Style','VIP Executive SUV','Command every arrival with stately presence, first-class comfort, and discreet VIP refinement—ideal for executive movement, airport transfers, and prestigious occasions.',120000,420,'250 km/h',7,'Automatic',array['Professional Chauffeur Available','VIP Privacy Glass','Executive Leather Seating','Tri-Zone Climate Control','Premium Surround Sound','Panoramic Roof']::text[],'https://media.base44.com/images/public/6a5537674461cdc7bdad66cf/30098f244_generated_image.png',array[]::text[],true,3,true) on conflict (slug) do nothing;
insert into public.cars (slug,name,style,description,price_per_day,horsepower,top_speed,seats,transmission,features,image_url,gallery,chauffeur_available,display_order,active) values ('grand-style','Grand Style','Grand Touring Sedan','A distinguished grand tourer balancing serene ride quality with effortless performance, crafted for elegant city travel, corporate engagements, and memorable celebrations.',120000,390,'250 km/h',5,'Automatic',array['Professional Chauffeur Available','Massage Leather Seats','Ambient Cabin Lighting','Wireless Charging','Premium Navigation','Adaptive Air Suspension']::text[],'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200',array[]::text[],true,4,true) on conflict (slug) do nothing;
insert into public.cars (slug,name,style,description,price_per_day,horsepower,top_speed,seats,transmission,features,image_url,gallery,chauffeur_available,display_order,active) values ('royal-style','Royal Style','Ultra-Luxury Sedan','Created for guests who expect exceptional refinement, the Royal Style offers a whisper-quiet cabin, indulgent rear-seat comfort, and unmistakable road presence.',150000,460,'250 km/h',5,'Automatic',array['Professional Chauffeur Available','Reclining Executive Seats','Rear Entertainment System','Privacy Curtains','Bespoke Premium Audio','Four-Zone Climate Control']::text[],'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200',array[]::text[],true,5,true) on conflict (slug) do nothing;
insert into public.cars (slug,name,style,description,price_per_day,horsepower,top_speed,seats,transmission,features,image_url,gallery,chauffeur_available,display_order,active) values ('phenomenal','Phenomenal','Luxury Performance SUV','The pinnacle of the fleet—bold, powerful, and exceptionally luxurious. Phenomenal transforms every journey into a statement-making experience without compromising comfort.',200000,600,'290 km/h',5,'Automatic',array['Elite Chauffeur Available','Performance Drive Modes','Night Vision Assist','Meridian Surround Sound','Heated and Ventilated Seats','360° Parking Camera']::text[],'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=1200',array[]::text[],true,6,true) on conflict (slug) do nothing;


-- Normalize historical reservations before enabling overlap enforcement. Without
-- this, an old UUID-based paid booking and a new slug-based booking could coexist.
update public.bookings b set item_id=r.slug from public.rooms r
where b.booking_type='stay' and r.slug is not null and b.item_id in (r.id::text, r.legacy_id);
update public.bookings b set item_id=c.slug from public.cars c
where b.booking_type='drive' and c.slug is not null and b.item_id in (c.id::text, c.legacy_id);

-- Keep the recovered legacy request RPC compatible with canonical catalog ids,
-- active-only catalog reads, and the same checkout hold used by the API.
create or replace function public.frensic_request_booking(p_apartment_id uuid, p_checkin date, p_checkout date, p_guests integer, p_notes text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare r public.rooms%rowtype; booking_id uuid; u uuid := auth.uid(); claims jsonb := auth.jwt(); email text := claims->>'email';
begin
  if u is null or coalesce(email,'') = '' or not exists (select 1 from auth.users where id = u and email_confirmed_at is not null) then
    raise exception 'Sign in with a verified email to continue';
  end if;
  if p_checkin is null or p_checkout is null or p_checkin < (now() at time zone 'Africa/Lagos')::date or p_checkout <= p_checkin or p_checkout - p_checkin > 90 then
    raise exception 'Choose valid dates for a stay of up to 90 nights';
  end if;
  if length(coalesce(p_notes,'')) > 2000 then raise exception 'Notes are too long'; end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text, 0));
  if (select count(*) from public.bookings b where lower(b.guest_email) = lower(email) and b.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many requests. Please try again later';
  end if;
  select * into r from public.rooms where id = p_apartment_id and active = true;
  if not found or r.price_per_night is null or r.price_per_night <= 0 then raise exception 'This apartment is unavailable'; end if;
  if p_guests is null or p_guests < 1 or p_guests > least(coalesce(r.max_guests, 6), 20) then raise exception 'Invalid guest count'; end if;
  insert into public.bookings(booking_type,item_id,item_name,start_date,end_date,guest_name,guest_email,guests_count,special_requests,nights_or_days,unit_price,total_amount,payment_status,booking_status,hold_expires_at)
  values ('stay',coalesce(r.slug, r.id::text),r.name,p_checkin,p_checkout,left(coalesce(nullif(claims->'user_metadata'->>'full_name',''), 'Guest'),200),email,p_guests,coalesce(p_notes,''),p_checkout-p_checkin,r.price_per_night,r.price_per_night * (p_checkout-p_checkin),'pending','pending',now() + interval '20 minutes')
  returning id into booking_id;
  return booking_id;
end $$;
revoke all on function public.frensic_request_booking(uuid,date,date,integer,text) from public, anon;
grant execute on function public.frensic_request_booking(uuid,date,date,integer,text) to authenticated;

do $$
declare conflict_count integer;
begin
  select count(*) into conflict_count from public.bookings a join public.bookings b
    on a.id < b.id and a.item_id = b.item_id and a.start_date < b.end_date and a.end_date > b.start_date
   where a.payment_status = 'paid' and b.payment_status = 'paid' and a.booking_status <> 'cancelled' and b.booking_status <> 'cancelled';
  if conflict_count > 0 then
    raise exception 'Resolve % existing overlapping paid booking pairs before applying this migration', conflict_count;
  end if;
end $$;

drop trigger if exists bookings_enforce_availability on public.bookings;
create trigger bookings_enforce_availability before insert or update of item_id, start_date, end_date, payment_status, booking_status, transfer_status, hold_expires_at on public.bookings
for each row execute function public.enforce_booking_availability();

create or replace function public.booking_stats(p_year integer)
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'totalRevenue', coalesce((select sum(total_amount) from public.bookings where payment_status = 'paid' and booking_status <> 'cancelled'), 0),
    'paidCount', (select count(*) from public.bookings where payment_status = 'paid' and booking_status <> 'cancelled'),
    'pendingCount', (select count(*) from public.bookings where payment_status = 'pending'),
    'stayCount', (select count(*) from public.bookings where payment_status = 'paid' and booking_type = 'stay' and booking_status <> 'cancelled'),
    'driveCount', (select count(*) from public.bookings where payment_status = 'paid' and booking_type = 'drive' and booking_status <> 'cancelled'),
    'monthly', coalesce((
      select json_agg(json_build_object('month', to_char(month, 'Mon'), 'revenue', coalesce(revenue, 0), 'bookings', coalesce(bookings, 0)) order by month)
      from (
        select m.month, sum(b.total_amount) filter (where b.id is not null) as revenue, count(b.id) as bookings
        from generate_series(make_date(p_year, 1, 1)::timestamptz, make_date(p_year, 1, 1)::timestamptz + interval '11 months', interval '1 month') as m(month)
        left join public.bookings b on date_trunc('month', b.created_at) = m.month and b.payment_status = 'paid' and b.booking_status <> 'cancelled'
        group by m.month
      ) months
    ), '[]'::json)
  );
$$;
revoke all on function public.booking_stats(integer) from public, anon, authenticated;
grant execute on function public.booking_stats(integer) to service_role;

commit;
