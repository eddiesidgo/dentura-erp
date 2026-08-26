CREATE TABLE clinics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code VARCHAR(40) NOT NULL,
    name VARCHAR(160) NOT NULL,
    logo_url VARCHAR(512),
    phone VARCHAR(40),
    email VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(120),
    department VARCHAR(120),
    nit VARCHAR(30),
    theme_mode VARCHAR(16) NOT NULL DEFAULT 'light',
    theme_color VARCHAR(32) NOT NULL DEFAULT 'indigo',
    primary_color_level INTEGER NOT NULL DEFAULT 600,
    nav_mode VARCHAR(32) NOT NULL DEFAULT 'transparent',
    layout_type VARCHAR(32) NOT NULL DEFAULT 'modern',
    direction VARCHAR(8) NOT NULL DEFAULT 'ltr',
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_clinics_code UNIQUE (code)
);

INSERT INTO clinics (
    code, name, theme_mode, theme_color, primary_color_level, nav_mode, layout_type, direction, active, created_at, updated_at
) VALUES (
    'default', 'Dentura', 'light', 'indigo', 600, 'transparent', 'modern', 'ltr', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN clinic_id INTEGER REFERENCES clinics (id);
CREATE INDEX idx_users_clinic ON users (clinic_id);

CREATE TABLE patients_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    record_number VARCHAR(20) NOT NULL,
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    sex VARCHAR(16),
    date_of_birth DATE,
    phone VARCHAR(40),
    mobile VARCHAR(40),
    email VARCHAR(255),
    address VARCHAR(255),
    city VARCHAR(120),
    department VARCHAR(120),
    dui VARCHAR(20),
    nit VARCHAR(30),
    occupation VARCHAR(120),
    referred_by VARCHAR(160),
    allergies TEXT,
    notes TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    CONSTRAINT uk_patients_clinic_record_number UNIQUE (clinic_id, record_number),
    CONSTRAINT uk_patients_clinic_dui UNIQUE (clinic_id, dui),
    FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

INSERT INTO patients_new (
    id, clinic_id, record_number, first_name, last_name, sex, date_of_birth, phone, mobile, email,
    address, city, department, dui, nit, occupation, referred_by, allergies, notes, active, created_at, updated_at
)
SELECT
    id,
    (SELECT id FROM clinics WHERE code = 'default'),
    record_number, first_name, last_name, sex, date_of_birth, phone, mobile, email,
    address, city, department, dui, nit, occupation, referred_by, allergies, notes, active, created_at, updated_at
FROM patients;

DROP TABLE patients;
ALTER TABLE patients_new RENAME TO patients;

CREATE INDEX idx_patients_name ON patients (last_name, first_name);
CREATE INDEX idx_patients_phone ON patients (phone);
CREATE INDEX idx_patients_mobile ON patients (mobile);
CREATE INDEX idx_patients_active ON patients (active);
CREATE INDEX idx_patients_clinic ON patients (clinic_id);
