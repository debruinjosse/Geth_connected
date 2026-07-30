-- Align public pricing with Growth €11.99/employee/month and Custom (enterprise) plans.

update public.plans
set
  name = 'Growth',
  description = 'For growing teams building a strong recognition culture. Up to 50 employees.',
  price_cents = 1199,
  currency = 'eur',
  interval = 'month',
  invoice_enabled = true,
  active = true,
  sort_order = 10
where plan_key = 'growth';

update public.plans
set
  name = 'Custom',
  description = 'For organizations with more than 50 employees driving culture at scale.',
  price_cents = 0,
  currency = 'eur',
  interval = 'month',
  invoice_enabled = true,
  active = true,
  sort_order = 20
where plan_key = 'enterprise';

update public.plans
set
  active = false,
  sort_order = 99
where plan_key = 'starter';
