-- Core workflow tables (case -> estimate -> order)
-- Note: Physical FK constraints are intentionally omitted.

create extension if not exists pgcrypto;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  case_name text not null,
  customer_name text not null,
  status text not null default 'draft',
  memo text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists estimates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  estimate_subject text not null,
  estimate_date date not null default current_date,
  status text not null default 'draft',
  subtotal numeric(12,2) not null default 0,
  tax_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  note text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  estimate_id uuid,
  order_title text not null,
  order_date date not null default current_date,
  status text not null default 'draft',
  amount_excl_tax numeric(12,2) not null default 0,
  amount_incl_tax numeric(12,2) not null default 0,
  note text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_cases_set_updated_at on cases;
create trigger trg_cases_set_updated_at
before update on cases
for each row execute function set_updated_at();

drop trigger if exists trg_estimates_set_updated_at on estimates;
create trigger trg_estimates_set_updated_at
before update on estimates
for each row execute function set_updated_at();

drop trigger if exists trg_orders_set_updated_at on orders;
create trigger trg_orders_set_updated_at
before update on orders
for each row execute function set_updated_at();
