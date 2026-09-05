-- Enable Supabase Realtime for the two tables the Flutter app subscribes to live: notifications
-- (badge/list updates) and recognition_events (dashboard updates when a card is given/claimed/
-- approved/acknowledged). Both tables already have RLS policies scoping reads to the current
-- user's own rows (or their company, for admins) — Realtime respects those same policies, so this
-- is purely additive and doesn't change who can see what. The web app doesn't use Realtime today,
-- so this has no effect on it.
alter table notifications replica identity full;
alter table recognition_events replica identity full;

alter publication supabase_realtime add table if not exists notifications;
alter publication supabase_realtime add table if not exists recognition_events;
