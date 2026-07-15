alter table companies
  add column if not exists billing_payment_method text not null default 'invoice',
  add column if not exists billing_email text,
  add column if not exists billing_notes text;

alter table plans
  add column if not exists invoice_enabled boolean not null default true;

alter table subscriptions
  add column if not exists payment_method text not null default 'invoice',
  add column if not exists invoice_status text not null default 'not_requested',
  add column if not exists invoice_requested_at timestamptz,
  add column if not exists invoice_approved_at timestamptz,
  add column if not exists invoice_reference text,
  add column if not exists billing_contact_email text;

create table if not exists billing_invoice_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  plan_id uuid references plans(id) on delete set null,
  requested_by uuid references profiles(id) on delete set null,
  billing_email text not null,
  vat_number text,
  purchase_order_number text,
  billing_address text,
  notes text,
  status text not null default 'pending',
  reviewed_by uuid references profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_invoice_requests_company_idx on billing_invoice_requests(company_id, created_at desc);
create index if not exists billing_invoice_requests_status_idx on billing_invoice_requests(status, created_at desc);
create index if not exists billing_invoice_requests_plan_idx on billing_invoice_requests(plan_id);
create index if not exists subscriptions_payment_method_idx on subscriptions(payment_method, invoice_status);

drop trigger if exists set_billing_invoice_requests_updated_at on billing_invoice_requests;
create trigger set_billing_invoice_requests_updated_at
before update on billing_invoice_requests
for each row
execute function set_updated_at();

alter table billing_invoice_requests enable row level security;

drop policy if exists "Company admins can read own invoice requests" on billing_invoice_requests;
create policy "Company admins can read own invoice requests"
on billing_invoice_requests for select
to authenticated
using (
  is_global_admin()
  or (
    is_company_admin()
    and company_id = current_profile_company_id()
  )
);

drop policy if exists "Company admins can create own invoice requests" on billing_invoice_requests;
create policy "Company admins can create own invoice requests"
on billing_invoice_requests for insert
to authenticated
with check (
  is_company_admin()
  and company_id = current_profile_company_id()
  and requested_by = auth.uid()
);

drop policy if exists "Global admins can manage invoice requests" on billing_invoice_requests;
create policy "Global admins can manage invoice requests"
on billing_invoice_requests for all
to authenticated
using (is_global_admin())
with check (is_global_admin());

update plans
set
  invoice_enabled = true,
  currency = 'eur'
where plan_key in ('starter', 'growth', 'enterprise');
