-- Lets platform admins switch off individual card categories (Communication/Creativity/
-- Competence/Collegiality/Open) per company, supporting a phased rollout (e.g. start a company
-- with only Communication enabled, add the others in later months). Keys mirror
-- mobile/lib/core/cards/card_category.dart's CardCategory enum values rather than the free-text,
-- locale-varying card_library.category column, so this stays locale-independent.
alter table public.companies
  add column if not exists enabled_card_categories jsonb not null
  default '{"communication": true, "creativity": true, "competence": true, "collegiality": true, "open": true}'::jsonb;
