ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;

CREATE TABLE password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash VARCHAR(128) NOT NULL,
    user_id INTEGER NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_password_reset_token_hash UNIQUE (token_hash),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_password_reset_tokens_user ON password_reset_tokens (user_id);

CREATE TABLE audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER,
    user_id INTEGER,
    username VARCHAR(100),
    action VARCHAR(20) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80),
    detail TEXT,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

CREATE INDEX idx_audit_events_clinic_created ON audit_events (clinic_id, created_at);
CREATE INDEX idx_audit_events_entity ON audit_events (clinic_id, entity_type);

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
  AND r.system_role = 1
  AND NOT EXISTS (
      SELECT 1 FROM role_permissions rp
      WHERE rp.role_id = r.id AND rp.permission_id = p.id
  );
