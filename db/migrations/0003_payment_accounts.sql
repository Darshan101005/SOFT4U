-- Real payment accounts (all receive PKR) and USD-order reconciliation.
-- Orders keep their own currency/total; fx_rate (PKR per USD) is locked at
-- creation and expected_pkr = round(total * fx_rate) is what the PKR account
-- should receive. The admin may record the amount actually received.
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS branch TEXT NOT NULL DEFAULT '';

ALTER TABLE orders ADD COLUMN IF NOT EXISTS expected_pkr NUMERIC(12,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS amount_received_pkr NUMERIC(12,2);
UPDATE orders SET expected_pkr = total_pkr WHERE expected_pkr IS NULL;

-- Proofs carry up to 3 screenshots plus an optional payment date.
ALTER TABLE payment_proofs ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE payment_proofs ADD COLUMN IF NOT EXISTS payment_date TEXT;
