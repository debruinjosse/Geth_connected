-- FCM device tokens: one row per (user, installed app instance). `fcm_token` is globally
-- unique per install regardless of which user is logged in, so the app always upserts on
-- conflict(fcm_token) — this single constraint gives us "no duplicate tokens," "a user can have
-- many devices," and "a token updates in place on refresh" all at once, including the edge case
-- where the same physical install logs in as a different user later (the row just re-parents).
create table if not exists device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  fcm_token text not null,
  platform text not null check (platform in ('android', 'ios')),
  app_version text,
  last_seen_at timestamptz not null default now(),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (fcm_token)
);

create index if not exists device_tokens_user_active_idx on device_tokens(user_id) where active;

alter table device_tokens enable row level security;

create trigger set_device_tokens_updated_at
before update on device_tokens
for each row execute function set_updated_at();

-- A user manages only their own device tokens; the send-push-notification edge function reads
-- across all users via the service-role key, which bypasses RLS entirely, so no broader select
-- policy is needed here for that path.
create policy "users manage own device tokens"
on device_tokens for all
to authenticated
using (user_id = auth.uid() or is_global_admin())
with check (user_id = auth.uid() or is_global_admin());
