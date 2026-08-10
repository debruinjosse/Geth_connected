alter table companies
  add column if not exists contact_name text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text;

comment on column companies.contact_name is 'Primary operational contact name for Super Admin CRM overview.';
comment on column companies.contact_phone is 'Primary operational contact phone for Super Admin CRM overview.';
comment on column companies.contact_email is 'Primary invite or contact email shown in Super Admin company overview.';
