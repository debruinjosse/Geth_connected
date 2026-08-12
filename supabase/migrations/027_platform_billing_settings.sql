create table if not exists public.platform_billing_settings (
  id uuid primary key default gen_random_uuid(),
  seller_legal_name text not null default '',
  seller_vat_number text,
  seller_billing_address text not null default '',
  seller_email text not null default '',
  payment_iban text not null default '',
  payment_bic text,
  payment_bank_name text,
  payment_reference_prefix text not null default 'GETH',
  payment_terms text not null default 'Payment due within 14 days by bank transfer.',
  payment_terms_days integer not null default 14 check (payment_terms_days > 0),
  vat_rate_percent numeric(5, 2) not null default 21 check (vat_rate_percent >= 0),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

drop trigger if exists set_platform_billing_settings_updated_at on public.platform_billing_settings;
create trigger set_platform_billing_settings_updated_at
before update on public.platform_billing_settings
for each row
execute function set_updated_at();

alter table public.platform_billing_settings enable row level security;

drop policy if exists "global admins can read platform billing settings" on public.platform_billing_settings;
create policy "global admins can read platform billing settings"
on public.platform_billing_settings for select
to authenticated
using (is_global_admin());

drop policy if exists "global admins can manage platform billing settings" on public.platform_billing_settings;
create policy "global admins can manage platform billing settings"
on public.platform_billing_settings for all
to authenticated
using (is_global_admin())
with check (is_global_admin());
