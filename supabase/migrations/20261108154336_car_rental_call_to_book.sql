-- Allow car rentals to be reserved by phone instead of an online payment gateway.
alter table public.bookings
  drop constraint if exists bookings_payment_method_check;

alter table public.bookings
  add constraint bookings_payment_method_check
  check (payment_method in ('paystack', 'bank_transfer', 'call_to_book'));
