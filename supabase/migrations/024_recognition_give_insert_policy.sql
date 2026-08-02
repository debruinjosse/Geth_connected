create policy "users can give recognition to company colleagues"
on recognition_events for insert
to authenticated
with check (
  giver_user_id = auth.uid()
  and receiver_user_id <> auth.uid()
  and company_id = current_profile_company_id()
  and exists (
    select 1
    from profiles receiver
    where receiver.id = receiver_user_id
      and receiver.company_id = current_profile_company_id()
      and receiver.status = 'active'
  )
);
