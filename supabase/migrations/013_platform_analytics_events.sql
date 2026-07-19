create table if not exists platform_analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  locale text not null default 'en',
  path text not null,
  event_type text not null check (event_type in ('page_view', 'time_spent')),
  duration_seconds integer,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists platform_analytics_events_created_idx
on platform_analytics_events(created_at desc);

create index if not exists platform_analytics_events_path_idx
on platform_analytics_events(path, created_at desc);

create index if not exists platform_analytics_events_company_idx
on platform_analytics_events(company_id, created_at desc);

alter table platform_analytics_events enable row level security;

drop policy if exists "Global admins can read platform analytics events" on platform_analytics_events;
create policy "Global admins can read platform analytics events"
on platform_analytics_events for select
using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('platform_admin', 'super_admin')
  )
);
