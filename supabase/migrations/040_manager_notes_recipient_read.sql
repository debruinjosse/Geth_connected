-- Employees (note recipients) can read the notes their manager sent them.
-- Previously only the manager, the company admin and global admins could select from
-- manager_notes, so the "Note from <manager>" notification pointed at a Messages page the
-- recipient could not actually read from.

drop policy if exists "recipients can read their manager notes" on public.manager_notes;
create policy "recipients can read their manager notes"
on public.manager_notes for select
to authenticated
using (recipient_user_id = auth.uid());

create index if not exists manager_notes_recipient_created_idx
on public.manager_notes(recipient_user_id, created_at desc);
