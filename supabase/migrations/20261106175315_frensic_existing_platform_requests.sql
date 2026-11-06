-- Recovered from the connected Supabase project's migration history.
-- Already applied there; retained so fresh/staging environments match production.
create function public.frensic_request_booking(p_apartment_id uuid, p_checkin date, p_checkout date, p_guests integer, p_notes text default '')
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
  select * into r from public.rooms where id = p_apartment_id;
  if not found or r.price_per_night is null or r.price_per_night <= 0 then raise exception 'This apartment is unavailable'; end if;
  if p_guests is null or p_guests < 1 or p_guests > least(coalesce(r.max_guests, 6), 20) then raise exception 'Invalid guest count'; end if;
  insert into public.bookings(booking_type,item_id,item_name,start_date,end_date,guest_name,guest_email,guests_count,special_requests,nights_or_days,unit_price,total_amount,payment_status,booking_status)
  values ('stay',r.id::text,r.name,p_checkin,p_checkout,left(coalesce(nullif(claims->'user_metadata'->>'full_name',''), 'Guest'),200),email,p_guests,coalesce(p_notes,''),p_checkout-p_checkin,r.price_per_night,r.price_per_night * (p_checkout-p_checkin),'pending','pending')
  returning id into booking_id;
  return booking_id;
end $$;
revoke all on function public.frensic_request_booking(uuid,date,date,integer,text) from public, anon;
grant execute on function public.frensic_request_booking(uuid,date,date,integer,text) to authenticated;

create function public.frensic_send_contact(p_name text, p_phone text, p_subject text, p_message text)
returns void language plpgsql security definer set search_path = '' as $$
declare u uuid := auth.uid(); claims jsonb := auth.jwt(); email text := claims->>'email';
begin
  if u is null or coalesce(email,'') = '' or not exists (select 1 from auth.users where id = u and email_confirmed_at is not null) then
    raise exception 'Sign in with a verified email to continue';
  end if;
  if length(trim(coalesce(p_name,''))) not between 1 and 200 or length(coalesce(p_phone,'')) > 40 or length(coalesce(p_subject,'')) > 200 or length(trim(coalesce(p_message,''))) not between 1 and 5000 then
    raise exception 'Please check your message';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(u::text, 1));
  if (select count(*) from public.contact_messages c where lower(c.email) = lower(email) and c.created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many messages. Please try again later';
  end if;
  insert into public.contact_messages(name,email,phone,subject,message) values (trim(p_name),email,coalesce(p_phone,''),coalesce(p_subject,''),trim(p_message));
end $$;
revoke all on function public.frensic_send_contact(text,text,text,text) from public, anon;
grant execute on function public.frensic_send_contact(text,text,text,text) to authenticated;
