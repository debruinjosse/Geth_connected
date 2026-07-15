create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_company_name_unique unique (company_id, name)
);

alter table profiles
  add column if not exists department_id uuid references departments(id) on delete set null;

alter table invitations
  add column if not exists department_id uuid references departments(id) on delete set null;

alter table teams
  add column if not exists department_id uuid references departments(id) on delete set null;

create index if not exists departments_company_idx on departments(company_id, name);
create index if not exists profiles_department_idx on profiles(company_id, department_id);
create index if not exists invitations_department_idx on invitations(company_id, department_id);
create index if not exists teams_department_idx on teams(company_id, department_id);

drop trigger if exists set_departments_updated_at on departments;
create trigger set_departments_updated_at
before update on departments
for each row
execute function set_updated_at();

alter table departments enable row level security;

drop policy if exists "Users can read departments in their company" on departments;
create policy "Users can read departments in their company"
on departments for select
to authenticated
using (
  company_id = current_profile_company_id()
  or is_global_admin()
);

drop policy if exists "Company admins can manage departments in their company" on departments;
create policy "Company admins can manage departments in their company"
on departments for all
to authenticated
using (
  is_global_admin()
  or (
    is_company_admin()
    and company_id = current_profile_company_id()
  )
)
with check (
  is_global_admin()
  or (
    is_company_admin()
    and company_id = current_profile_company_id()
  )
);

insert into departments (company_id, name)
select distinct company_id, name
from teams
where company_id is not null
on conflict (company_id, name) do nothing;

update teams
set department_id = departments.id
from departments
where teams.department_id is null
  and teams.company_id = departments.company_id
  and lower(teams.name) = lower(departments.name);

update profiles
set department_id = teams.department_id
from teams
where profiles.department_id is null
  and profiles.team_id = teams.id
  and teams.department_id is not null;

update invitations
set department_id = teams.department_id
from teams
where invitations.department_id is null
  and invitations.team_id = teams.id
  and teams.department_id is not null;

create table if not exists billing_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  subscription_id uuid references subscriptions(id) on delete set null,
  invoice_request_id uuid references billing_invoice_requests(id) on delete set null,
  plan_id uuid references plans(id) on delete set null,
  invoice_number text not null unique,
  status text not null default 'issued',
  issue_date date not null default current_date,
  due_date date not null,
  currency text not null default 'eur',
  subtotal_cents integer not null,
  vat_rate_bps integer not null default 2100,
  vat_cents integer not null,
  total_cents integer not null,
  billing_email text not null,
  buyer_name text not null,
  buyer_vat_number text,
  buyer_billing_address text,
  seller_legal_name text not null,
  seller_vat_number text,
  seller_billing_address text not null,
  seller_email text not null,
  payment_iban text not null,
  payment_bic text,
  payment_reference text not null,
  payment_terms text not null,
  notes text,
  email_sent_at timestamptz,
  email_error text,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_invoices_company_idx on billing_invoices(company_id, created_at desc);
create index if not exists billing_invoices_status_idx on billing_invoices(status, due_date);
create index if not exists billing_invoices_request_idx on billing_invoices(invoice_request_id);

drop trigger if exists set_billing_invoices_updated_at on billing_invoices;
create trigger set_billing_invoices_updated_at
before update on billing_invoices
for each row
execute function set_updated_at();

alter table billing_invoices enable row level security;

drop policy if exists "Company admins can read own invoices" on billing_invoices;
create policy "Company admins can read own invoices"
on billing_invoices for select
to authenticated
using (
  is_global_admin()
  or (
    is_company_admin()
    and company_id = current_profile_company_id()
  )
);

drop policy if exists "Company admins can create own invoices" on billing_invoices;
create policy "Company admins can create own invoices"
on billing_invoices for insert
to authenticated
with check (
  is_company_admin()
  and company_id = current_profile_company_id()
  and created_by = auth.uid()
);

drop policy if exists "Global admins can manage invoices" on billing_invoices;
create policy "Global admins can manage invoices"
on billing_invoices for all
to authenticated
using (is_global_admin())
with check (is_global_admin());
