-- Seed minimum master data for production-like operation.
-- This file is idempotent.

insert into user_groups (id, group_name, version)
values ('11111111-1111-1111-1111-111111111111', '管理者', 1)
on conflict (id) do update
set group_name = excluded.group_name;

insert into users (
  id,
  login_id,
  password_hash,
  user_name,
  group_id,
  is_active,
  version
)
values (
  '22222222-2222-2222-2222-222222222222',
  'owner',
  'sha256:4c1029697ee358715d3a14a2add817c4b01651440de808371f78165ac90dc581',
  'Admin',
  '11111111-1111-1111-1111-111111111111',
  true,
  1
)
on conflict (id) do update
set
  login_id = excluded.login_id,
  user_name = excluded.user_name,
  group_id = excluded.group_id,
  is_active = excluded.is_active,
  password_hash = excluded.password_hash;

insert into roles (menu_id, group_id, permission_level, version)
values
  ('cases', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('estimates', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('orders', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('small-orders', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('estimate-lines', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('order-lines', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('manufacturing-jobs', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('diecut-specs', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('lc-specs', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('customers', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('customer-branches', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('customer-contacts', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('billing-infos', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('delivery-destinations', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('tax-rates', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('invoices', '11111111-1111-1111-1111-111111111111', 3, 1),
  ('staff', '11111111-1111-1111-1111-111111111111', 3, 1)
on conflict (menu_id, group_id) do update
set permission_level = excluded.permission_level;

insert into tax_rates (tax_name, rate, rounding_method, taxation_type, active)
values ('標準税率', 10.00, 2, 'taxable', true)
on conflict do nothing;

insert into case_types (type_name)
values ('一般'), ('リピート')
on conflict (type_name) do nothing;
