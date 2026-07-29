alter table public.billing_invoice_requests
  add column if not exists billing_interval text not null default 'monthly',
  add column if not exists seat_count integer not null default 1,
  add column if not exists custom_amount_cents integer;

alter table public.billing_invoice_requests
  drop constraint if exists billing_invoice_requests_billing_interval_check;

alter table public.billing_invoice_requests
  add constraint billing_invoice_requests_billing_interval_check
  check (billing_interval in ('monthly', 'yearly'));

alter table public.billing_invoice_requests
  drop constraint if exists billing_invoice_requests_seat_count_check;

alter table public.billing_invoice_requests
  add constraint billing_invoice_requests_seat_count_check
  check (seat_count > 0);

alter table public.billing_invoice_requests
  drop constraint if exists billing_invoice_requests_custom_amount_check;

alter table public.billing_invoice_requests
  add constraint billing_invoice_requests_custom_amount_check
  check (custom_amount_cents is null or custom_amount_cents > 0);

alter table public.billing_invoices
  add column if not exists billing_interval text not null default 'monthly',
  add column if not exists seat_count integer not null default 1,
  add column if not exists unit_price_cents integer,
  add column if not exists custom_amount_cents integer;

alter table public.billing_invoices
  drop constraint if exists billing_invoices_billing_interval_check;

alter table public.billing_invoices
  add constraint billing_invoices_billing_interval_check
  check (billing_interval in ('monthly', 'yearly'));

alter table public.billing_invoices
  drop constraint if exists billing_invoices_seat_count_check;

alter table public.billing_invoices
  add constraint billing_invoices_seat_count_check
  check (seat_count > 0);

alter table public.billing_invoices
  drop constraint if exists billing_invoices_custom_amount_check;

alter table public.billing_invoices
  add constraint billing_invoices_custom_amount_check
  check (custom_amount_cents is null or custom_amount_cents > 0);

update public.plans
set
  price_cents = case plan_key
    when 'starter' then 1900
    when 'growth' then 2900
    when 'enterprise' then 0
    else price_cents
  end,
  currency = 'eur',
  interval = 'month',
  invoice_enabled = true
where plan_key in ('starter', 'growth', 'enterprise');
