CREATE TABLE prescription_templates (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL,
    drug VARCHAR(160) NOT NULL,
    dose VARCHAR(80),
    frequency VARCHAR(80),
    duration VARCHAR(80),
    instructions TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_rx_templates_clinic FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

CREATE TABLE prescriptions (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    drug VARCHAR(160) NOT NULL,
    dose VARCHAR(80),
    frequency VARCHAR(80),
    duration VARCHAR(80),
    instructions TEXT,
    prescribed_at TIMESTAMPTZ NOT NULL,
    template_id BIGINT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_prescriptions_clinic FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    CONSTRAINT fk_prescriptions_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    CONSTRAINT fk_prescriptions_template FOREIGN KEY (template_id) REFERENCES prescription_templates (id) ON DELETE SET NULL
);

CREATE INDEX idx_rx_templates_clinic ON prescription_templates (clinic_id);
CREATE INDEX idx_prescriptions_clinic_patient ON prescriptions (clinic_id, patient_id);
