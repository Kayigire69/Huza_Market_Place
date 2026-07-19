-- AlterTable Product: Phase 3 P0 inventory metadata
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "inventorySource" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "purchaseMethod" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "qualityGrade" TEXT;

CREATE INDEX IF NOT EXISTS "Product_inventorySource_idx" ON "Product"("inventorySource");
CREATE INDEX IF NOT EXISTS "Product_purchaseMethod_idx" ON "Product"("purchaseMethod");
