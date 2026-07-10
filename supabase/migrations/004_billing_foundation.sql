create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null unique,
  name text not null,
  description text,
  stripe_price_id text unique,
  price_cents integer not null default 0,
  currency text not null default 'usd',
  interval text not null default 'month',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table companies
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists subscription_status text not null default 'not_configured',
  add column if not exists subscription_current_period_end timestamptz;

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  plan_id uuid references plans(id) on delete set null,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'incomplete',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_company_unique unique (company_id)
);

create index if not exists plans_active_idx on plans(active, sort_order);
create index if not exists subscriptions_company_idx on subscriptions(company_id);
create index if not exists subscriptions_status_idx on subscriptions(status);
create index if not exists subscriptions_stripe_customer_idx on subscriptions(stripe_customer_id);

drop trigger if exists set_plans_updated_at on plans;
create trigger set_plans_updated_at
before update on plans
for each row
execute function set_updated_at();

drop trigger if exists set_subscriptions_updated_at on subscriptions;
create trigger set_subscriptions_updated_at
before update on subscriptions
for each row
execute function set_updated_at();

alter table plans enable row level security;
alter table subscriptions enable row level security;

drop policy if exists "Authenticated users can read active plans" on plans;
create policy "Authenticated users can read active plans"
on plans for select
to authenticated
using (active = true or is_global_admin());

drop policy if exists "Global admins can manage plans" on plans;
create policy "Global admins can manage plans"
on plans for all
to authenticated
using (is_global_admin())
with check (is_global_admin());

drop policy if exists "Company admins can read own subscription" on subscriptions;
create policy "Company admins can read own subscription"
on subscriptions for select
to authenticated
using (
  is_global_admin()
  or (
    is_company_admin()
    and company_id = current_profile_company_id()
  )
);

drop policy if exists "Global admins can manage subscriptions" on subscriptions;
create policy "Global admins can manage subscriptions"
on subscriptions for all
to authenticated
using (is_global_admin())
with check (is_global_admin());

insert into plans (plan_key, name, description, price_cents, currency, interval, sort_order)
values
  ('starter', 'Starter', 'Core connected card library and employee recognition tracking.', 0, 'usd', 'month', 10),
  ('growth', 'Growth', 'Manager dashboards, company analytics, invites, and reports.', 2900, 'usd', 'month', 20),
  ('enterprise', 'Enterprise', 'Advanced controls, premium support, and enterprise onboarding.', 0, 'usd', 'month', 30)
on conflict (plan_key) do update
set
  name = excluded.name,
  description = excluded.description,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  interval = excluded.interval,
  sort_order = excluded.sort_order;
