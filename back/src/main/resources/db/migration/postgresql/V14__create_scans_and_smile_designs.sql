CREATE TABLE patient_scans (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    arch VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    relative_path VARCHAR(500) NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_scans_clinic FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    CONSTRAINT fk_scans_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
);

CREATE INDEX idx_scans_clinic_patient ON patient_scans (clinic_id, patient_id);
CREATE INDEX idx_scans_arch ON patient_scans (clinic_id, patient_id, arch);

CREATE TABLE smile_designs (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    scan_id BIGINT,
    name VARCHAR(160) NOT NULL,
    status VARCHAR(20) NOT NULL,
    design_json TEXT NOT NULL,
    export_relative_path VARCHAR(500),
    export_file_name VARCHAR(255),
    export_content_type VARCHAR(100),
    export_size_bytes BIGINT,
    version INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_smile_clinic FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    CONSTRAINT fk_smile_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    CONSTRAINT fk_smile_scan FOREIGN KEY (scan_id) REFERENCES patient_scans (id) ON DELETE SET NULL
);

CREATE INDEX idx_smile_clinic_patient ON smile_designs (clinic_id, patient_id);
