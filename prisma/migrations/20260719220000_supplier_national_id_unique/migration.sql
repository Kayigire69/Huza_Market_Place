-- Unique National ID for farmer (SUPPLIER) accounts — login uses phone + last 4 digits.
-- Multiple NULLs remain allowed (Postgres UNIQUE).
CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_nationalId_key" ON "Supplier"("nationalId");
