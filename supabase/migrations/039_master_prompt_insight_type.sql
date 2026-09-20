-- The Insights hub's hero "GETH AI insight" card (Generate/Refresh button) used to silently reuse
-- the Growth Timeline insight type/prompt/endpoint end-to-end. This gives it its own admin-editable
-- master prompt (insight_type = 'master_prompt') and its own per-company on/off toggle, matching
-- the split already done for Growth Timeline vs. Hidden Patterns in migration 037.

alter table public.ai_master_prompt_settings
  drop constraint if exists ai_master_prompt_settings_insight_type_check;

alter table public.ai_master_prompt_settings
  add constraint ai_master_prompt_settings_insight_type_check
  check (insight_type in ('growth_timeline', 'hidden_patterns', 'master_prompt'));

alter table public.companies
  alter column enabled_insight_features
  set default '{"growthTimeline": true, "hiddenPatterns": true, "milestones": true, "masterInsight": true}'::jsonb;

update public.companies
set enabled_insight_features = enabled_insight_features || '{"masterInsight": true}'::jsonb
where not (enabled_insight_features ? 'masterInsight');
