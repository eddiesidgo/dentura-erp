CREATE TABLE ledger_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    work_id INTEGER,
    type VARCHAR(20) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description VARCHAR(255),
    entry_date TIMESTAMP NOT NULL,
    payment_id INTEGER,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works (id) ON DELETE SET NULL,
    FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE SET NULL
);

CREATE INDEX idx_ledger_clinic_patient ON ledger_entries (clinic_id, patient_id, entry_date);
CREATE INDEX idx_ledger_payment ON ledger_entries (payment_id);
CREATE UNIQUE INDEX uq_ledger_work_charge ON ledger_entries (work_id) WHERE type = 'CHARGE' AND work_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ledger_payment_entry ON ledger_entries (payment_id) WHERE type = 'PAYMENT' AND payment_id IS NOT NULL;
