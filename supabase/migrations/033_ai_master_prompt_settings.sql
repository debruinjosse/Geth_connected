-- Global, super-admin-editable "tone guidance" block appended to the AI insight system prompt
-- (see lib/ai/prompts/employee-insight-prompt.ts). Singleton table, mirrors the pattern in
-- 027_platform_billing_settings.sql. tone_guidance defaults to '' — empty string is the sentinel
-- meaning "use the hardcoded default" (see lib/ai/master-prompt-settings.ts), so "reset to
-- default" is just writing '' back rather than deleting the row.
create table if not exists public.ai_master_prompt_settings (
  id uuid primary key default gen_random_uuid(),
  tone_guidance text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create trigger set_ai_master_prompt_settings_updated_at
before update on public.ai_master_prompt_settings
for each row
execute function set_updated_at();

alter table public.ai_master_prompt_settings enable row level security;

create policy "global admins can read ai master prompt settings"
on public.ai_master_prompt_settings for select
to authenticated
using (is_global_admin());

create policy "global admins can manage ai master prompt settings"
on public.ai_master_prompt_settings for all
to authenticated
using (is_global_admin())
with check (is_global_admin());
