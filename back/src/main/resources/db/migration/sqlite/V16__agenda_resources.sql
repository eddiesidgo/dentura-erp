CREATE TABLE providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    name VARCHAR(120) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
    user_id INTEGER,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE INDEX idx_providers_clinic ON providers (clinic_id);

CREATE TABLE rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    name VARCHAR(120) NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

CREATE INDEX idx_rooms_clinic ON rooms (clinic_id);

INSERT INTO providers (clinic_id, name, color, active, created_at, updated_at)
SELECT c.id, 'General', '#3B82F6', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM clinics c
WHERE NOT EXISTS (
    SELECT 1 FROM providers p WHERE p.clinic_id = c.id AND p.name = 'General'
);

ALTER TABLE appointments ADD COLUMN provider_id INTEGER;
ALTER TABLE appointments ADD COLUMN room_id INTEGER;

UPDATE appointments
SET provider_id = (
    SELECT p.id FROM providers p
    WHERE p.clinic_id = appointments.clinic_id AND p.name = 'General'
    LIMIT 1
)
WHERE provider_id IS NULL;

CREATE INDEX idx_appointments_provider ON appointments (provider_id, start_at);
CREATE INDEX idx_appointments_room ON appointments (room_id, start_at);
