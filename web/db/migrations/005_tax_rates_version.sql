-- Add version for optimistic locking on tax_rates.
alter table tax_rates
  add column if not exists version integer not null default 1;
