CREATE TABLE referral_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    name VARCHAR(160) NOT NULL,
    type VARCHAR(20) NOT NULL,
    phone VARCHAR(40),
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

CREATE TABLE outbound_referrals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    specialty VARCHAR(120) NOT NULL,
    to_name VARCHAR(160),
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    referred_at TIMESTAMP NOT NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
);

ALTER TABLE patients ADD COLUMN referral_source_id INTEGER REFERENCES referral_sources (id) ON DELETE SET NULL;

CREATE INDEX idx_referral_sources_clinic ON referral_sources (clinic_id);
CREATE INDEX idx_outbound_referrals_clinic_patient ON outbound_referrals (clinic_id, patient_id);
CREATE INDEX idx_patients_referral_source ON patients (referral_source_id);
