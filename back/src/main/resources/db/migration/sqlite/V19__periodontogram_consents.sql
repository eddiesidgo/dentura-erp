CREATE TABLE periodontogram_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    tooth VARCHAR(8) NOT NULL,
    values_json TEXT,
    notes TEXT,
    recorded_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
);

CREATE INDEX idx_perio_patient ON periodontogram_entries (clinic_id, patient_id, tooth);

CREATE TABLE consent_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    body_html TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

CREATE INDEX idx_consent_templates_clinic ON consent_templates (clinic_id);

CREATE TABLE patient_consents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    template_id INTEGER NOT NULL,
    signer_name VARCHAR(160) NOT NULL,
    accepted_at TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES consent_templates (id)
);

CREATE INDEX idx_patient_consents_patient ON patient_consents (clinic_id, patient_id);
