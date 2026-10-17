-- Optional personal details an employee can add to their profile (for demographic reporting and
-- to send sign-up / download links by SMS). Kept in a separate table instead of new columns on
-- `profiles` because `profiles` is readable by everyone in the company; these details are only
-- visible to the person themself, their company admin, and global admins.

create table if not exists public.profile_personal_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  gender text check (gender in ('female', 'male', 'non_binary', 'prefer_not_to_say')),
  birthdate date check (birthdate is null or (birthdate > date '1900-01-01' and birthdate <= current_date)),
  mobile_number text check (mobile_number is null or char_length(mobile_number) between 6 and 24),
  city text check (city is null or char_length(city) <= 80),
  updated_at timestamptz not null default now()
);

alter table public.profile_personal_details enable row level security;

drop policy if exists "users can read own personal details" on public.profile_personal_details;
create policy "users can read own personal details"
on public.profile_personal_details for select
to authenticated
using (
  user_id = auth.uid()
  or is_global_admin()
  or (
    is_company_admin()
    and exists (
      select 1 from public.profiles p
      where p.id = profile_personal_details.user_id
        and p.company_id = current_profile_company_id()
    )
  )
);

drop policy if exists "users can insert own personal details" on public.profile_personal_details;
create policy "users can insert own personal details"
on public.profile_personal_details for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "users can update own personal details" on public.profile_personal_details;
create policy "users can update own personal details"
on public.profile_personal_details for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
