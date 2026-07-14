alter table public.bookings
  add column if not exists payment_method text check (payment_method in ('paystack', 'bank_transfer')),
  add column if not exists transfer_status text check (transfer_status in ('awaiting_payment', 'receipt_submitted', 'expired')),
  add column if not exists payment_receipt_url text,
  add column if not exists receipt_submitted_at timestamptz;

create index if not exists bookings_transfer_status_idx on public.bookings (transfer_status);