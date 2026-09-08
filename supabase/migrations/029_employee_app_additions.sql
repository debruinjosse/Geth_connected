-- Supports the employee mobile app's notification preferences, one-time onboarding flag,
-- account-deletion requests, and AI-insight reporting. None of these require a mobile API
-- route: preferences/onboarding go through self-scoped RPCs (mirroring
-- update_own_profile_name/update_own_profile_photo, since plain self-UPDATE on profiles isn't
-- RLS-permitted), and the two new tables are insert-own-only, so the Flutter app can write to
-- everything here directly via Supabase.

alter table profiles
  add column if not exists notification_prefs jsonb not null default '{}'::jsonb,
  add column if not exists onboarding_completed_at timestamptz;

create or replace function public.update_own_notification_prefs(
  prefs_input jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if prefs_input is null or jsonb_typeof(prefs_input) != 'object' then
    raise exception 'invalid_preferences';
  end if;

  update public.profiles
  set notification_prefs = prefs_input
  where id = auth.uid();
end;
$$;

revoke all on function public.update_own_notification_prefs(jsonb) from public;
grant execute on function public.update_own_notification_prefs(jsonb) to authenticated;

create or replace function public.mark_own_onboarding_complete()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  update public.profiles
  set onboarding_completed_at = now()
  where id = auth.uid() and onboarding_completed_at is null;
end;
$$;

revoke all on function public.mark_own_onboarding_complete() from public;
grant execute on function public.mark_own_onboarding_complete() to authenticated;

-- Records a request only — actual deletion remains a manual admin process, same as the existing
-- deleteCompanyAction pattern. Matches the brief's "request account or data deletion" wording.
create table if not exists account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table account_deletion_requests enable row level security;

create index if not exists account_deletion_requests_user_idx on account_deletion_requests(user_id, requested_at desc);

create policy "users can create their own deletion request"
on account_deletion_requests for insert
to authenticated
with check (user_id = auth.uid());

create policy "users can read their own deletion requests"
on account_deletion_requests for select
to authenticated
using (user_id = auth.uid() or is_global_admin());

-- "Report an incorrect or inappropriate AI insight" (brief §11).
create table if not exists ai_insight_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  insight_text text not null,
  reason text,
  created_at timestamptz not null default now()
);

alter table ai_insight_reports enable row level security;

create index if not exists ai_insight_reports_user_idx on ai_insight_reports(user_id, created_at desc);

create policy "users can report their own ai insights"
on ai_insight_reports for insert
to authenticated
with check (user_id = auth.uid());

create policy "users can read their own ai insight reports"
on ai_insight_reports for select
to authenticated
using (user_id = auth.uid() or is_global_admin());
