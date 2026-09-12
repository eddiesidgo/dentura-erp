CREATE TABLE clinic_receipt_sequences (
    clinic_id INTEGER PRIMARY KEY,
    next_number INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

CREATE TABLE payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    receipt_number INTEGER NOT NULL,
    paid_at TIMESTAMP NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(20) NOT NULL,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE,
    UNIQUE (clinic_id, receipt_number)
);

CREATE TABLE payment_allocations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payment_id INTEGER NOT NULL,
    work_id INTEGER,
    amount NUMERIC(12, 2) NOT NULL,
    FOREIGN KEY (payment_id) REFERENCES payments (id) ON DELETE CASCADE,
    FOREIGN KEY (work_id) REFERENCES works (id)
);

CREATE INDEX idx_payments_clinic_patient ON payments (clinic_id, patient_id);
CREATE INDEX idx_payments_paid_at ON payments (clinic_id, paid_at);
CREATE INDEX idx_payment_alloc_payment ON payment_allocations (payment_id);
CREATE INDEX idx_payment_alloc_work ON payment_allocations (work_id);
