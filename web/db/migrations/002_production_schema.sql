  -- Production-like schema expansion based on plan.md
  -- Physical FK constraints are intentionally omitted.

  create extension if not exists pgcrypto;

  create table if not exists document_sequences (
    id uuid primary key default gen_random_uuid(),
    target_name text not null unique,
    sequence_key text not null,
    current_number bigint not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists tax_rates (
    id uuid primary key default gen_random_uuid(),
    tax_name text not null,
    rate numeric(5,2) not null,
    rounding_method smallint not null default 2,
    taxation_type text not null default 'taxable',
    active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists app_settings (
    id uuid primary key default gen_random_uuid(),
    setting_name text not null unique,
    setting_value text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists user_groups (
    id uuid primary key default gen_random_uuid(),
    group_name text not null unique,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    login_id text not null unique,
    password_hash text not null,
    user_name text not null,
    group_id uuid,
    is_active boolean not null default true,
    email text,
    phone text,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists roles (
    id uuid primary key default gen_random_uuid(),
    menu_id text not null,
    group_id uuid not null,
    permission_level smallint not null default 1,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (menu_id, group_id)
  );

  create table if not exists customers (
    id uuid primary key default gen_random_uuid(),
    organization_name text not null,
    department_name text,
    is_active boolean not null default true,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists customer_branches (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null,
    department_name text,
    postal_code text,
    prefecture text,
    city text,
    address_line text,
    phone text,
    email text,
    yayoi_code text,
    closing_day smallint,
    payment_day smallint,
    other_code text,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists customer_contacts (
    id uuid primary key default gen_random_uuid(),
    customer_branch_id uuid not null,
    company_name text,
    position_name text,
    phone text,
    email text,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists billing_infos (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null,
    billing_name text not null,
    billing_contact_name text,
    postal_code text,
    prefecture text,
    city text,
    address_line text,
    phone text,
    email text,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists delivery_destinations (
    id uuid primary key default gen_random_uuid(),
    destination_name text not null,
    postal_code text,
    prefecture text,
    city text,
    address_line text,
    phone text,
    email text,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists case_types (
    id uuid primary key default gen_random_uuid(),
    type_name text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  alter table cases
    add column if not exists customer_id uuid,
    add column if not exists customer_branch_id uuid,
    add column if not exists customer_contact_id uuid,
    add column if not exists case_type_id uuid,
    add column if not exists sales_user_id uuid;

  create table if not exists estimate_lines (
    id uuid primary key default gen_random_uuid(),
    estimate_id uuid not null,
    line_no integer not null,
    item_name text not null,
    unit_price numeric(12,2) not null default 0,
    quantity numeric(12,3) not null default 0,
    unit text,
    tax_rate numeric(5,2) not null default 10,
    tax_amount numeric(12,2) not null default 0,
    note text,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (estimate_id, line_no)
  );

  create table if not exists order_lines (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null,
    line_no integer not null,
    item_name text not null,
    unit_price numeric(12,2) not null default 0,
    quantity numeric(12,3) not null default 0,
    unit text,
    tax_rate numeric(5,2) not null default 10,
    tax_amount numeric(12,2) not null default 0,
    note text,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (order_id, line_no)
  );

  create table if not exists small_order_categories (
    id uuid primary key default gen_random_uuid(),
    category_name text not null,
    category_label text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists small_order_templates (
    id uuid primary key default gen_random_uuid(),
    line_no integer not null,
    detail_name text not null,
    target_hour_rate numeric(12,2) not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists small_orders (
    id uuid primary key default gen_random_uuid(),
    case_id uuid not null,
    estimate_id uuid,
    assignee_user_id uuid,
    order_category text,
    order_type text,
    customer_branch_id uuid,
    order_date date,
    item_name text,
    delivery_date date,
    delivery_slot text,
    delivery_note text,
    base_fee numeric(12,2) not null default 0,
    planned_billing_amount numeric(12,2) not null default 0,
    actual_billing_amount numeric(12,2) not null default 0,
    planned_human_rate_amount numeric(12,2) not null default 0,
    actual_human_rate_amount numeric(12,2) not null default 0,
    planned_profit_amount numeric(12,2) not null default 0,
    actual_profit_amount numeric(12,2) not null default 0,
    final_billing_amount numeric(12,2) not null default 0,
    final_profit_amount numeric(12,2) not null default 0,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists small_order_lines (
    id uuid primary key default gen_random_uuid(),
    small_order_id uuid not null,
    template_id uuid,
    line_no integer not null,
    detail_name text not null,
    planned_hours numeric(12,2) not null default 0,
    actual_hours numeric(12,2) not null default 0,
    planned_amount numeric(12,2) not null default 0,
    actual_amount numeric(12,2) not null default 0,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (small_order_id, line_no)
  );

  create table if not exists diecut_order_specs (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null,
    mold_no text,
    deposit_items jsonb not null default '{}'::jsonb,
    machine_name text,
    paper_name text,
    paper_size text,
    surface_processing text,
    mold_jaw text,
    mold_adjustment_value text,
    nick_1 text,
    nick_2 text,
    process_name_1 text,
    process_name_2 text,
    process_name_3 text,
    process_name_4 text,
    process_name_5 text,
    process_name_6 text,
    process_notes jsonb not null default '{}'::jsonb,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists lc_order_specs (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null,
    delivery_destination_id uuid,
    delivery_method text,
    data_note text,
    specification text,
    supplied_materials jsonb not null default '{}'::jsonb,
    arranged_materials jsonb not null default '{}'::jsonb,
    print_surface text,
    print_back text,
    varnish text,
    plate text,
    pp text,
    wpp text,
    lamination text,
    memo text,
    image_url text,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists manufacturing_jobs (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null,
    mold_no text,
    slip_created boolean not null default false,
    data_created boolean not null default false,
    laser_done boolean not null default false,
    molding_done boolean not null default false,
    stripper_done boolean not null default false,
    inspection_done boolean not null default false,
    rubber_paste_done boolean not null default false,
    rubber_inspection_done boolean not null default false,
    can_deliver boolean not null default false,
    delivery_date date,
    delivery_time text,
    note text,
    mold_cost numeric(12,2) not null default 0,
    stripper_cost numeric(12,2) not null default 0,
    board_cost numeric(12,2) not null default 0,
    material_cost numeric(12,2) not null default 0,
    contribution_profit numeric(12,2) not null default 0,
    contribution_profit_rate numeric(7,4) not null default 0,
    total_work_minutes integer not null default 0,
    total_human_rate_cost numeric(12,2) not null default 0,
    human_rate_ratio numeric(7,4) not null default 0,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists invoices (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null,
    invoice_date date not null default current_date,
    total_amount numeric(12,2) not null default 0,
    due_date date,
    version integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create table if not exists audit_logs (
    id uuid primary key default gen_random_uuid(),
    table_name text not null,
    operation text not null,
    actor_user_id uuid,
    row_id text,
    before_data jsonb,
    after_data jsonb,
    success boolean not null default true,
    request_id text,
    created_at timestamptz not null default now()
  );

  create index if not exists idx_cases_status on cases(status);
  create index if not exists idx_estimates_case_id on estimates(case_id);
  create index if not exists idx_orders_case_id on orders(case_id);
  create index if not exists idx_orders_estimate_id on orders(estimate_id);
  create index if not exists idx_estimate_lines_estimate_id on estimate_lines(estimate_id);
  create index if not exists idx_order_lines_order_id on order_lines(order_id);
  create index if not exists idx_audit_logs_created_at on audit_logs(created_at);
  create index if not exists idx_audit_logs_table on audit_logs(table_name, created_at desc);

  create or replace function mask_sensitive_jsonb(input_data jsonb)
  returns jsonb as $$
  declare
    result jsonb;
  begin
    if input_data is null then
      return null;
    end if;

    result := input_data
      - 'password_hash'
      - 'token'
      - 'access_token'
      - 'refresh_token'
      - 'SUPABASE_SERVICE_ROLE_KEY';

    return result;
  end;
  $$ language plpgsql;

  create or replace function write_audit_log()
  returns trigger as $$
  declare
    actor_id uuid;
    target_id text;
  begin
    begin
      actor_id := nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    exception when others then
      actor_id := null;
    end;

    if tg_op = 'INSERT' then
      target_id := coalesce((to_jsonb(new)->>'id'), '');
      insert into audit_logs(table_name, operation, actor_user_id, row_id, before_data, after_data, success, request_id)
      values (tg_table_name, tg_op, actor_id, target_id, null, mask_sensitive_jsonb(to_jsonb(new)), true, null);
      return new;
    elsif tg_op = 'UPDATE' then
      target_id := coalesce((to_jsonb(new)->>'id'), '');
      insert into audit_logs(table_name, operation, actor_user_id, row_id, before_data, after_data, success, request_id)
      values (tg_table_name, tg_op, actor_id, target_id, mask_sensitive_jsonb(to_jsonb(old)), mask_sensitive_jsonb(to_jsonb(new)), true, null);
      return new;
    else
      target_id := coalesce((to_jsonb(old)->>'id'), '');
      insert into audit_logs(table_name, operation, actor_user_id, row_id, before_data, after_data, success, request_id)
      values (tg_table_name, tg_op, actor_id, target_id, mask_sensitive_jsonb(to_jsonb(old)), null, true, null);
      return old;
    end if;
  end;
  $$ language plpgsql;

  do $$
  declare
    target_table text;
    update_targets text[] := array[
      'document_sequences',
      'tax_rates',
      'app_settings',
      'user_groups',
      'users',
      'roles',
      'customers',
      'customer_branches',
      'customer_contacts',
      'billing_infos',
      'delivery_destinations',
      'cases',
      'estimates',
      'estimate_lines',
      'orders',
      'order_lines',
      'small_orders',
      'small_order_lines',
      'diecut_order_specs',
      'lc_order_specs',
      'manufacturing_jobs',
      'invoices'
    ];
    audit_targets text[] := array[
      'cases',
      'estimates',
      'estimate_lines',
      'orders',
      'order_lines',
      'small_orders',
      'small_order_lines',
      'manufacturing_jobs',
      'invoices'
    ];
  begin
    foreach target_table in array update_targets
    loop
      execute format('drop trigger if exists trg_%I_set_updated_at on %I', target_table, target_table);
      execute format('create trigger trg_%I_set_updated_at before update on %I for each row execute function set_updated_at()', target_table, target_table);
    end loop;

    foreach target_table in array audit_targets
    loop
      execute format('drop trigger if exists trg_%I_audit on %I', target_table, target_table);
      execute format('create trigger trg_%I_audit after insert or update or delete on %I for each row execute function write_audit_log()', target_table, target_table);
    end loop;
  end $$;
