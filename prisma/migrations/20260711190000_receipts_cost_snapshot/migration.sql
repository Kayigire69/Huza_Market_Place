-- Dual receipt system + structured delivery address (Phase 1, EBM-ready)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "purchasePrice" INTEGER;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryDistrict" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliverySector" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryCell" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryVillage" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_receiptNumber_key" ON "Order"("receiptNumber");

ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "unitCostPrice" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "costTotal" INTEGER;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "marginTotal" INTEGER;
