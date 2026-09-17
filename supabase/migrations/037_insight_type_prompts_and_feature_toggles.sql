-- Growth Timeline and Hidden Patterns used to share one AI prompt/config, producing identical
-- output for both. This splits ai_master_prompt_settings into one editable row per insight type,
-- and adds a per-company toggle so admins can turn either Insights section on/off for a customer.
alter table public.ai_master_prompt_settings
  add column if not exists insight_type text not null default 'growth_timeline';

alter table public.ai_master_prompt_settings
  add constraint ai_master_prompt_settings_insight_type_check
  check (insight_type in ('growth_timeline', 'hidden_patterns'));

create unique index if not exists ai_master_prompt_settings_insight_type_idx
on public.ai_master_prompt_settings(insight_type);

alter table public.companies
  add column if not exists enabled_insight_features jsonb not null
  default '{"growthTimeline": true, "hiddenPatterns": true, "milestones": true}'::jsonb;
