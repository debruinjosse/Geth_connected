create table if not exists public.demo_bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null,
  team_size text,
  role text,
  preferred_date date,
  preferred_time text,
  timezone text,
  duration_minutes integer not null default 30,
  message text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  admin_note text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.demo_bookings enable row level security;

drop policy if exists "Global admins can read demo bookings" on public.demo_bookings;
create policy "Global admins can read demo bookings"
  on public.demo_bookings for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'platform_admin')
    )
  );

drop policy if exists "Global admins can update demo bookings" on public.demo_bookings;
create policy "Global admins can update demo bookings"
  on public.demo_bookings for update
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'platform_admin')
    )
  )
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('super_admin', 'platform_admin')
    )
  );
