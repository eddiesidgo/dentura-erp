CREATE TABLE ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    patient_id BIGINT NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
    work_id BIGINT REFERENCES works (id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description VARCHAR(255),
    entry_date TIMESTAMPTZ NOT NULL,
    payment_id BIGINT REFERENCES payments (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_ledger_clinic_patient ON ledger_entries (clinic_id, patient_id, entry_date);
CREATE INDEX idx_ledger_payment ON ledger_entries (payment_id);
CREATE UNIQUE INDEX uq_ledger_work_charge ON ledger_entries (work_id) WHERE type = 'CHARGE' AND work_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ledger_payment_entry ON ledger_entries (payment_id) WHERE type = 'PAYMENT' AND payment_id IS NOT NULL;
