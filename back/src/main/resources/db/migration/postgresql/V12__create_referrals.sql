CREATE TABLE referral_sources (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL,
    name VARCHAR(160) NOT NULL,
    type VARCHAR(20) NOT NULL,
    phone VARCHAR(40),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_referral_sources_clinic FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

CREATE TABLE outbound_referrals (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    specialty VARCHAR(120) NOT NULL,
    to_name VARCHAR(160),
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    referred_at TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT fk_outbound_referrals_clinic FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    CONSTRAINT fk_outbound_referrals_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
);

ALTER TABLE patients ADD COLUMN referral_source_id BIGINT;
ALTER TABLE patients ADD CONSTRAINT fk_patients_referral_source
    FOREIGN KEY (referral_source_id) REFERENCES referral_sources (id) ON DELETE SET NULL;

CREATE INDEX idx_referral_sources_clinic ON referral_sources (clinic_id);
CREATE INDEX idx_outbound_referrals_clinic_patient ON outbound_referrals (clinic_id, patient_id);
CREATE INDEX idx_patients_referral_source ON patients (referral_source_id);
