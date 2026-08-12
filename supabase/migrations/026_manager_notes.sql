create table if not exists public.manager_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  manager_user_id uuid not null references public.profiles(id) on delete cascade,
  recipient_user_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 3 and 500),
  created_at timestamptz not null default now()
);

create index if not exists manager_notes_manager_created_idx
on public.manager_notes(manager_user_id, created_at desc);

create index if not exists manager_notes_company_created_idx
on public.manager_notes(company_id, created_at desc);

alter table public.manager_notes enable row level security;

drop policy if exists "managers can read own manager notes" on public.manager_notes;
create policy "managers can read own manager notes"
on public.manager_notes for select
to authenticated
using (
  manager_user_id = auth.uid()
  or is_global_admin()
  or (
    is_company_admin()
    and company_id = current_profile_company_id()
  )
);

drop policy if exists "managers can insert own manager notes" on public.manager_notes;
create policy "managers can insert own manager notes"
on public.manager_notes for insert
to authenticated
with check (
  manager_user_id = auth.uid()
  or is_global_admin()
);
