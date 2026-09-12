-- Backs the mobile "achievements" screen's milestone cards, which today are 100% static demo
-- data (progress fractions, dates, counts are all hardcoded literals). Streaks are deliberately
-- NOT persisted here — they're derived live from recognition_events at read time, the same
-- "compute from ground truth, don't keep a second copy" approach the growth-stage ladder already
-- uses in mobile/lib/core/growth/growth_journey.dart.
--
-- Unlocks are recomputed (not client-writable) via a self-scoped RPC, same reasoning as
-- update_own_notification_prefs in 029_employee_app_additions.sql: a user must not be able to
-- fake having unlocked a milestone.

create table achievement_unlocks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  milestone_key text not null,
  unlocked_at timestamptz not null default now(),
  unique (profile_id, milestone_key)
);

alter table achievement_unlocks enable row level security;

create index achievement_unlocks_profile_idx on achievement_unlocks(profile_id);

create policy "users can read own achievement unlocks"
on achievement_unlocks for select
to authenticated
using (profile_id = auth.uid());

-- No insert/update/delete policy is granted to authenticated users at all — every write goes
-- through sync_own_achievement_unlocks() below via security definer.

create or replace function public.sync_own_achievement_unlocks()
returns setof achievement_unlocks
language plpgsql
security definer
set search_path = public
as $$
declare
  received_count int;
  given_count int;
  cross_team_count int;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select count(*) into received_count from recognition_events where receiver_user_id = auth.uid();
  select count(*) into given_count from recognition_events where giver_user_id = auth.uid();

  select count(*) into cross_team_count
  from recognition_events re
  join profiles giver on giver.id = re.giver_user_id
  join profiles me on me.id = auth.uid()
  where re.receiver_user_id = auth.uid()
    and giver.team_id is distinct from me.team_id;

  if received_count >= 1 then
    insert into achievement_unlocks (profile_id, milestone_key) values (auth.uid(), 'first_received') on conflict do nothing;
  end if;
  if received_count >= 10 then
    insert into achievement_unlocks (profile_id, milestone_key) values (auth.uid(), 'ten_received') on conflict do nothing;
  end if;
  if given_count >= 1 then
    insert into achievement_unlocks (profile_id, milestone_key) values (auth.uid(), 'first_given') on conflict do nothing;
  end if;
  if given_count >= 10 then
    insert into achievement_unlocks (profile_id, milestone_key) values (auth.uid(), 'ten_given') on conflict do nothing;
  end if;
  if cross_team_count >= 1 then
    insert into achievement_unlocks (profile_id, milestone_key) values (auth.uid(), 'cross_team') on conflict do nothing;
  end if;
  if received_count + given_count >= 100 then
    insert into achievement_unlocks (profile_id, milestone_key) values (auth.uid(), 'hundred_total') on conflict do nothing;
  end if;

  return query select * from achievement_unlocks where profile_id = auth.uid();
end;
$$;

revoke all on function public.sync_own_achievement_unlocks() from public;
grant execute on function public.sync_own_achievement_unlocks() to authenticated;
