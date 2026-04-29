-- アプリユーザ owner の廃止（003 でのシード削除に合わせ、既存 DB の行を除去）。
delete from users
where login_id = 'owner'
   or id = '22222222-2222-2222-2222-222222222222';
