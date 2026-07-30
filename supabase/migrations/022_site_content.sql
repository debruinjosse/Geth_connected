-- Editable homepage copy (super admin CMS). Falls back to messages/*.json when empty.

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  namespace text not null,
  key text not null,
  locale text not null check (locale in ('en', 'nl')),
  value text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint site_content_namespace_key_locale_unique unique (namespace, key, locale)
);

create index if not exists site_content_namespace_locale_idx
on public.site_content(namespace, locale);

drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at
before update on public.site_content
for each row
execute function set_updated_at();

alter table public.site_content enable row level security;

drop policy if exists "Anyone can read site content" on public.site_content;
create policy "Anyone can read site content"
on public.site_content for select
to authenticated, anon
using (true);

drop policy if exists "Global admins can manage site content" on public.site_content;
create policy "Global admins can manage site content"
on public.site_content for all
to authenticated
using (is_global_admin())
with check (is_global_admin());
