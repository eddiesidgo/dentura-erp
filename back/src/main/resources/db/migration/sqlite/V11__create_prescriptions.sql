CREATE TABLE prescription_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    drug VARCHAR(160) NOT NULL,
    dose VARCHAR(80),
    frequency VARCHAR(80),
    duration VARCHAR(80),
    instructions TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

CREATE TABLE prescriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    drug VARCHAR(160) NOT NULL,
    dose VARCHAR(80),
    frequency VARCHAR(80),
    duration VARCHAR(80),
    instructions TEXT,
    prescribed_at TIMESTAMP NOT NULL,
    template_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES prescription_templates (id) ON DELETE SET NULL
);

CREATE INDEX idx_rx_templates_clinic ON prescription_templates (clinic_id);
CREATE INDEX idx_prescriptions_clinic_patient ON prescriptions (clinic_id, patient_id);
