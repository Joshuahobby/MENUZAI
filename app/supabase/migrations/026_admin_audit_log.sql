-- Immutable record of admin-initiated mutations (plan overrides, AI config
-- changes). Written server-side via service_role; never modified after insert.
CREATE TABLE admin_audit_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  action       text        NOT NULL,  -- 'plan_override' | 'ai_config_change'
  performed_by text        NOT NULL,  -- admin email
  target_type  text,                  -- 'restaurant' | 'platform'
  target_id    text,                  -- restaurant uuid as text, null for platform
  target_name  text,
  old_value    jsonb,
  new_value    jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON admin_audit_log (created_at DESC);
CREATE INDEX ON admin_audit_log (action);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
