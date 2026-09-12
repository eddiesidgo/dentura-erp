CREATE TABLE odontogram_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    tooth VARCHAR(10) NOT NULL,
    surfaces VARCHAR(20),
    condition VARCHAR(40) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'EXISTING',
    work_id INTEGER,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works (id) ON DELETE SET NULL
);

CREATE INDEX idx_odontogram_clinic_patient ON odontogram_entries (clinic_id, patient_id);
CREATE INDEX idx_odontogram_tooth ON odontogram_entries (clinic_id, patient_id, tooth);
