-- 案件状態の表記を下書き / アクティブ / 終了 に揃える（コードは英字のまま）
update cases set status = 'active' where status = 'in_progress';
update cases set status = 'closed' where status = 'done';
