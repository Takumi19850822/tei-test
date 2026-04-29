-- 社員管理メニュー権限（既に003で投入済みの環境では no-op）
insert into roles (menu_id, group_id, permission_level, version)
values ('staff', '11111111-1111-1111-1111-111111111111', 3, 1)
on conflict (menu_id, group_id) do update
set permission_level = excluded.permission_level;
