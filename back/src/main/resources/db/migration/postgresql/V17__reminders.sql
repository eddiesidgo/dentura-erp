ALTER TABLE clinics ADD COLUMN IF NOT EXISTS reminder_hours_before INTEGER NOT NULL DEFAULT 24;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS reminder_message_template TEXT;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS reminder_default_country_code VARCHAR(8) NOT NULL DEFAULT '503';

UPDATE clinics
SET reminder_message_template = 'Hola {patientName}, le recordamos su cita el {date} a las {time} en {clinicName}. Confirme su asistencia.'
WHERE reminder_message_template IS NULL;

CREATE TABLE IF NOT EXISTS reminder_queue (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    appointment_id BIGINT NOT NULL REFERENCES appointments (id) ON DELETE CASCADE,
    patient_id BIGINT NOT NULL REFERENCES patients (id) ON DELETE CASCADE,
    phone_normalized VARCHAR(32) NOT NULL,
    message_body TEXT NOT NULL,
    wa_me_url VARCHAR(512) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    scheduled_for TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_reminder_queue_appointment UNIQUE (appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_reminder_queue_clinic_status ON reminder_queue (clinic_id, status, scheduled_for);
