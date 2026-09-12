CREATE TABLE patient_photos (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    category VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    relative_path VARCHAR(500) NOT NULL,
    caption TEXT,
    taken_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_photos_clinic FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    CONSTRAINT fk_photos_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
);

CREATE INDEX idx_photos_clinic_patient ON patient_photos (clinic_id, patient_id);
CREATE INDEX idx_photos_category ON patient_photos (clinic_id, patient_id, category);
