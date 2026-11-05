-- Additive extension for doctor activation and prescription dispensing.
-- Existing rows are preserved; legacy prescription quantities remain NULL so
-- a dispenser cannot guess a dose quantity that was never prescribed.
ALTER TABLE DOCTOR
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS doctor_active_name_idx
    ON DOCTOR (full_name)
    WHERE is_active = TRUE;

ALTER TABLE PRESCRIPTION_MEDICINE
    ADD COLUMN IF NOT EXISTS route TEXT,
    ADD COLUMN IF NOT EXISTS frequency TEXT,
    ADD COLUMN IF NOT EXISTS quantity_prescribed INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'prescription_medicine_quantity_positive_ck'
          AND conrelid = 'prescription_medicine'::regclass
    ) THEN
        ALTER TABLE PRESCRIPTION_MEDICINE
            ADD CONSTRAINT prescription_medicine_quantity_positive_ck
            CHECK (quantity_prescribed IS NULL OR quantity_prescribed > 0);
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS PRESCRIPTION_DISPENSING (
    dispensing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_key UUID NOT NULL UNIQUE,
    prescription_id UUID NOT NULL,
    medicine_id UUID NOT NULL,
    inventory_batch_id UUID NOT NULL
        REFERENCES MEDICINE_INVENTORY_BATCH (inventory_batch_id) ON DELETE RESTRICT,
    dispensed_by UUID REFERENCES APP_USER (user_id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id, medicine_id)
        REFERENCES PRESCRIPTION_MEDICINE (prescription_id, medicine_id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS prescription_dispensing_line_idx
    ON PRESCRIPTION_DISPENSING (prescription_id, medicine_id, created_at DESC);
