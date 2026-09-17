CREATE TABLE providers (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    name VARCHAR(120) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    user_id BIGINT REFERENCES users (id) ON DELETE SET NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_providers_clinic ON providers (clinic_id);

CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    name VARCHAR(120) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_rooms_clinic ON rooms (clinic_id);

INSERT INTO providers (clinic_id, name, color, active, created_at, updated_at)
SELECT c.id, 'General', '#3B82F6', TRUE, NOW(), NOW()
FROM clinics c
WHERE NOT EXISTS (
    SELECT 1 FROM providers p WHERE p.clinic_id = c.id AND p.name = 'General'
);

ALTER TABLE appointments ADD COLUMN provider_id BIGINT;
ALTER TABLE appointments ADD COLUMN room_id BIGINT;

UPDATE appointments a
SET provider_id = p.id
FROM providers p
WHERE p.clinic_id = a.clinic_id
  AND p.name = 'General'
  AND a.provider_id IS NULL;

ALTER TABLE appointments ALTER COLUMN provider_id SET NOT NULL;

ALTER TABLE appointments
    ADD CONSTRAINT fk_appointments_provider FOREIGN KEY (provider_id) REFERENCES providers (id);

ALTER TABLE appointments
    ADD CONSTRAINT fk_appointments_room FOREIGN KEY (room_id) REFERENCES rooms (id) ON DELETE SET NULL;

CREATE INDEX idx_appointments_provider ON appointments (provider_id, start_at);
CREATE INDEX idx_appointments_room ON appointments (room_id, start_at);
