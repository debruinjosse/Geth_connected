alter table recognition_events
  add column if not exists claim_origin text not null default 'direct_link',
  add column if not exists originated_digitally boolean not null default true;

create index if not exists recognition_claim_origin_idx
on recognition_events(company_id, claim_origin, created_at desc);
