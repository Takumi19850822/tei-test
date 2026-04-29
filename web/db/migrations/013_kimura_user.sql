-- 管理者グループのログインユーザ kimura（平文パスワードは含めない。pbkdf2 のみ）。
-- 前提: 003_seed_production_basics.sql（user_groups・roles）。

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
  '33333333-3333-3333-3333-333333333333',
  'kimura',
  'pbkdf2:210000:uUK5_NbMT-_bDUxGNu9Izw:1lL9jsh-PkT12EA2d_9nHOcVF2DZwSfe8viAsTxofV0',
  '木村',
  '11111111-1111-1111-1111-111111111111',
  true,
  1
)
on conflict (login_id) do update
set
  password_hash = excluded.password_hash,
  user_name = excluded.user_name,
  group_id = excluded.group_id,
  is_active = excluded.is_active;
