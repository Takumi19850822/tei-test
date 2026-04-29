-- Audit log retention (14 days) for debug-focused operation.
-- Run periodically via Supabase Scheduled Function / external cron:
-- select cleanup_audit_logs();

create or replace function cleanup_audit_logs()
returns integer as $$
declare
  deleted_count integer;
begin
  delete from audit_logs
  where created_at < now() - interval '14 days';

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$ language plpgsql;
