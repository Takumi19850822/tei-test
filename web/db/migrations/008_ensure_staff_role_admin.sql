-- 管理者グループに社員管理メニューの権限を確実に付与（未投入の環境向け）
insert into roles (menu_id, group_id, permission_level, version)
values ('staff', '11111111-1111-1111-1111-111111111111', 3, 1)
on conflict (menu_id, group_id) do update
set permission_level = greatest(roles.permission_level, excluded.permission_level);
