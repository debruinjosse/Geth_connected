alter table public.demo_bookings
  add column if not exists locale text not null default 'en';
