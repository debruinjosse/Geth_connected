create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  company_id uuid references companies(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create index if not exists notifications_user_created_idx
on notifications(user_id, created_at desc);

create index if not exists notifications_user_unread_idx
on notifications(user_id, read_at)
where read_at is null;

create index if not exists notifications_company_created_idx
on notifications(company_id, created_at desc);

drop policy if exists "users can read own notifications" on notifications;
create policy "users can read own notifications"
on notifications for select
to authenticated
using (
  user_id = auth.uid()
  or is_global_admin()
);

drop policy if exists "users can update own notification read state" on notifications;
create policy "users can update own notification read state"
on notifications for update
to authenticated
using (
  user_id = auth.uid()
  or is_global_admin()
)
with check (
  user_id = auth.uid()
  or is_global_admin()
);

drop policy if exists "company admins can read company notifications" on notifications;
create policy "company admins can read company notifications"
on notifications for select
to authenticated
using (
  is_global_admin()
  or (
    is_company_admin()
    and company_id = current_profile_company_id()
  )
);
