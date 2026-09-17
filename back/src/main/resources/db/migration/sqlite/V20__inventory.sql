CREATE TABLE inventory_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    sku VARCHAR(60),
    name VARCHAR(160) NOT NULL,
    unit VARCHAR(40) NOT NULL DEFAULT 'u',
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    min_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id)
);

CREATE INDEX idx_inventory_items_clinic ON inventory_items (clinic_id);

CREATE TABLE inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clinic_id INTEGER NOT NULL,
    item_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL,
    note VARCHAR(255),
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (clinic_id) REFERENCES clinics (id),
    FOREIGN KEY (item_id) REFERENCES inventory_items (id) ON DELETE CASCADE
);

CREATE INDEX idx_inventory_movements_item ON inventory_movements (item_id, created_at);
