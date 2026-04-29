-- 初期管理者の表示名を Admin に統一（003 再実行が無い環境向け）
update users
set user_name = 'Admin'
where id = '22222222-2222-2222-2222-222222222222'
   or login_id = 'owner';
