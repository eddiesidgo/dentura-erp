CREATE TABLE treatments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(160) NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_treatments_clinic_code UNIQUE (clinic_id, code),
    FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

CREATE INDEX idx_treatments_clinic_name ON treatments (clinic_id, name);
