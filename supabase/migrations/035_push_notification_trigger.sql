-- Fires the send-push-notification edge function automatically whenever any existing code path
-- inserts into `notifications` (lib/notifications.ts's createNotification, and every caller of
-- it) — zero changes needed to the 5+ existing web call sites. Uses pg_net (async HTTP from
-- Postgres) plus Supabase Vault for the two secrets this trigger needs: the project's edge
-- function base URL and a service-role key to authenticate the call. Neither secret is stored in
-- this file or anywhere in git — they must be created once via the Supabase SQL editor after this
-- migration runs (see the implementation report for the exact one-time setup commands), for
-- example:
--   select vault.create_secret('https://<project-ref>.supabase.co/functions/v1', 'project_functions_base_url');
--   select vault.create_secret('<service-role-key>', 'service_role_key');
-- Until those two vault secrets exist, this trigger safely no-ops (logs a warning) rather than
-- failing the insert — a missing push is not allowed to block writing the in-app notification row.
create extension if not exists pg_net with schema extensions;

create or replace function notify_push_on_notification_insert()
returns trigger
language plpgsql
security definer
set search_path = public, extensions, vault
as $$
declare
  functions_base_url text;
  service_role_key text;
begin
  select decrypted_secret into functions_base_url from vault.decrypted_secrets where name = 'project_functions_base_url';
  select decrypted_secret into service_role_key from vault.decrypted_secrets where name = 'service_role_key';

  if functions_base_url is null or service_role_key is null then
    raise warning 'notify_push_on_notification_insert: vault secrets not configured yet, skipping push for notification %', new.id;
    return new;
  end if;

  perform net.http_post(
    url := functions_base_url || '/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'userId', new.user_id,
      'companyId', new.company_id,
      'type', new.type,
      'title', new.title,
      'body', new.body,
      'notificationId', new.id
    )
  );

  return new;
end;
$$;

create trigger trigger_push_on_notification_insert
after insert on notifications
for each row execute function notify_push_on_notification_insert();
