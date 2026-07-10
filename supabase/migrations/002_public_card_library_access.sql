drop policy if exists "authenticated users can read active cards" on card_library;

create policy "public users can read active cards"
on card_library for select
to public
using (active = true);
