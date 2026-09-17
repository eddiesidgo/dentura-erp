CREATE TABLE inventory_items (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    sku VARCHAR(60),
    name VARCHAR(160) NOT NULL,
    unit VARCHAR(40) NOT NULL DEFAULT 'u',
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    min_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_inventory_items_clinic ON inventory_items (clinic_id);

CREATE TABLE inventory_movements (
    id BIGSERIAL PRIMARY KEY,
    clinic_id BIGINT NOT NULL REFERENCES clinics (id),
    item_id BIGINT NOT NULL REFERENCES inventory_items (id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_inventory_movements_item ON inventory_movements (item_id, created_at);
