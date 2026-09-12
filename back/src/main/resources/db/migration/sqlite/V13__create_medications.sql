CREATE TABLE medications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(160) NOT NULL,
    form VARCHAR(80),
    dose VARCHAR(80),
    frequency VARCHAR(80),
    duration VARCHAR(80),
    instructions TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    UNIQUE (clinic_id, code)
);

CREATE INDEX idx_medications_clinic_active ON medications (clinic_id, active);
CREATE INDEX idx_medications_clinic_name ON medications (clinic_id, name);

ALTER TABLE prescriptions ADD COLUMN medication_id INTEGER NULL REFERENCES medications (id) ON DELETE SET NULL;
