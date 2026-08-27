CREATE TABLE treatments (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(160) NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_treatments_clinic_code UNIQUE (clinic_id, code),
    CONSTRAINT fk_treatments_clinic FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

CREATE INDEX idx_treatments_clinic_name ON treatments (clinic_id, name);
