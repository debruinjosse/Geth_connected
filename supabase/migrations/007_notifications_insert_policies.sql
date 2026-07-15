drop policy if exists "authenticated users can create scoped notifications" on notifications;

create policy "authenticated users can create scoped notifications"
on notifications for insert
to authenticated
with check (
  user_id = auth.uid()
  or is_global_admin()
  or (
    company_id = current_profile_company_id()
    and exists (
      select 1
      from profiles target_profile
      where target_profile.id = notifications.user_id
        and target_profile.company_id = current_profile_company_id()
    )
  )
);
