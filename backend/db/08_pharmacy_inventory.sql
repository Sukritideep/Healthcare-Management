-- Additive pharmacy stock ledger. Apply manually after reviewing the target DB.
-- This migration does not alter or remove existing hospital records.
CREATE TABLE IF NOT EXISTS MEDICINE_INVENTORY_BATCH (
    inventory_batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id UUID NOT NULL REFERENCES MEDICINE (medicine_id) ON DELETE RESTRICT,
    batch_number TEXT NOT NULL CHECK (length(trim(batch_number)) > 0),
    expiry_date DATE NOT NULL,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    reorder_level INTEGER NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
    supplier_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (medicine_id, batch_number)
);

CREATE INDEX IF NOT EXISTS medicine_inventory_expiry_idx
    ON MEDICINE_INVENTORY_BATCH (expiry_date);
CREATE INDEX IF NOT EXISTS medicine_inventory_low_stock_idx
    ON MEDICINE_INVENTORY_BATCH (medicine_id, quantity_on_hand);

CREATE TABLE IF NOT EXISTS INVENTORY_MOVEMENT (
    movement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_key UUID NOT NULL UNIQUE,
    inventory_batch_id UUID NOT NULL
        REFERENCES MEDICINE_INVENTORY_BATCH (inventory_batch_id) ON DELETE RESTRICT,
    changed_by UUID REFERENCES APP_USER (user_id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('stock_in', 'stock_out')),
    quantity_delta INTEGER NOT NULL CHECK (quantity_delta <> 0),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
      (action = 'stock_in' AND quantity_delta > 0)
      OR (action = 'stock_out' AND quantity_delta < 0)
    )
);

CREATE INDEX IF NOT EXISTS inventory_movement_batch_created_idx
    ON INVENTORY_MOVEMENT (inventory_batch_id, created_at DESC);
