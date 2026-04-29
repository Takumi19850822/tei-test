-- 初期管理者 owner: ログインパスワード「owner」の SHA-256 フィンガープリント
update users
set password_hash = 'sha256:4c1029697ee358715d3a14a2add817c4b01651440de808371f78165ac90dc581'
where login_id = 'owner'
  and password_hash = 'temporary_hash_replace_me';
