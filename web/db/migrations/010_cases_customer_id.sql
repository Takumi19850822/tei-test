-- 案件と顧客マスタの紐付け（任意・NULL なら従来どおり顧客名テキストのみ）
alter table cases
  add column if not exists customer_id uuid;
