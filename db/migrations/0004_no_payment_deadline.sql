-- Customers pay exactly the order total in the order currency; there is no
-- PKR reconciliation and no deadline for uploading the payment proof.
ALTER TABLE orders DROP COLUMN IF EXISTS expected_pkr;
ALTER TABLE orders DROP COLUMN IF EXISTS amount_received_pkr;
DROP INDEX IF EXISTS orders_pending_expiry_idx;
ALTER TABLE orders DROP COLUMN IF EXISTS expires_at;
