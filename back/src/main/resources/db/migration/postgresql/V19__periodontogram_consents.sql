CREATE TABLE periodontogram_entries (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    patient_id BIGINT NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
    tooth VARCHAR(8) NOT NULL,
    values_json TEXT,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_perio_patient ON periodontogram_entries (clinic_id, patient_id, tooth);

CREATE TABLE consent_templates (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    title VARCHAR(200) NOT NULL,
    body_html TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_consent_templates_clinic ON consent_templates (clinic_id);

CREATE TABLE patient_consents (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    patient_id BIGINT NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
    template_id BIGINT NOT NULL REFERENCES consent_templates (id),
    signer_name VARCHAR(160) NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_patient_consents_patient ON patient_consents (clinic_id, patient_id);
