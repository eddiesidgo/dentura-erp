ALTER TABLE clinics ADD COLUMN reminder_hours_before INTEGER NOT NULL DEFAULT 24;
ALTER TABLE clinics ADD COLUMN reminder_message_template TEXT;
ALTER TABLE clinics ADD COLUMN reminder_default_country_code VARCHAR(8) NOT NULL DEFAULT '503';

UPDATE clinics
SET reminder_message_template = 'Hola {patientName}, le recordamos su cita el {date} a las {time} en {clinicName}. Confirme su asistencia.'
WHERE reminder_message_template IS NULL;

CREATE TABLE reminder_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    appointment_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    phone_normalized VARCHAR(32) NOT NULL,
    message_body TEXT NOT NULL,
    wa_me_url VARCHAR(512) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    scheduled_for TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE (appointment_id),
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
);

CREATE INDEX idx_reminder_queue_clinic_status ON reminder_queue (clinic_id, status, scheduled_for);
