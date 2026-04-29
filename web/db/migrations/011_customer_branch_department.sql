-- 顧客部署名は拠点単位で保持（顧客ヘッダの department_name と二重にならないよう、既存値は拠点へ移す）
alter table customer_branches
  add column if not exists department_name text;

update customer_branches cb
set department_name = c.department_name
from customers c
where cb.customer_id = c.id
  and c.department_name is not null
  and trim(c.department_name) <> ''
  and (cb.department_name is null or trim(cb.department_name) = '');
