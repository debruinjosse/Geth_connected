alter table public.demo_bookings
  drop constraint if exists demo_bookings_status_check;

alter table public.demo_bookings
  add constraint demo_bookings_status_check
  check (status in ('pending', 'approved', 'declined', 'rescheduled'));
