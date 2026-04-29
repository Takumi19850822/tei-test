-- Seed minimum master data for production-like operation.
-- This file is idempotent.

insert into user_groups (id, group_name, version)
values ('11111111-1111-1111-1111-111111111111', '管理者', 1)
on conflict (id) do update
set group_name = excluded.group_name;

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
