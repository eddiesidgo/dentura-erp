CREATE TABLE patient_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    category VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes INTEGER NOT NULL,
    relative_path VARCHAR(500) NOT NULL,
    caption TEXT,
    taken_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
);

CREATE INDEX idx_photos_clinic_patient ON patient_photos (clinic_id, patient_id);
CREATE INDEX idx_photos_category ON patient_photos (clinic_id, patient_id, category);
