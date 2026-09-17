ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    token_hash VARCHAR(128) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_password_reset_token_hash UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens (user_id);

CREATE TABLE IF NOT EXISTS audit_events (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT REFERENCES clinics (id),
    user_id BIGINT,
    username VARCHAR(100),
    action VARCHAR(20) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80),
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_clinic_created ON audit_events (clinic_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit_events (clinic_id, entity_type);

INSERT INTO permissions (code, name, description)
SELECT 'clinic.manage', 'Gestionar clínica', 'Permite editar la identidad y logo de la clínica'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'clinic.manage');

INSERT INTO permissions (code, name, description)
SELECT 'audit.read', 'Ver auditoría', 'Consulta el registro de auditoría de la clínica'
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE code = 'audit.read');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('clinic.manage', 'audit.read')
WHERE r.code = 'administrador'
  AND r.system_role = TRUE
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
