-- Persists each cron job execution so the admin can see last-run status without
-- relying on ephemeral Vercel runtime logs.
CREATE TABLE cron_execution_logs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name      text        NOT NULL,
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  status        text        NOT NULL DEFAULT 'running', -- running | success | error
  rows_affected int         NOT NULL DEFAULT 0,
  error_message text,
  details       jsonb       NOT NULL DEFAULT '{}'
);

CREATE INDEX ON cron_execution_logs (job_name, started_at DESC);

-- Only service_role may read/write (cron routes use the admin client).
ALTER TABLE cron_execution_logs ENABLE ROW LEVEL SECURITY;
