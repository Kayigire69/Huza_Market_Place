-- Clear orphan product links before adding FK
UPDATE "MarketPurchase"
SET "productId" = NULL
WHERE "productId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "Product" p WHERE p.id = "MarketPurchase"."productId");

CREATE INDEX IF NOT EXISTS "MarketPurchase_productId_idx" ON "MarketPurchase"("productId");

DO $$ BEGIN
  ALTER TABLE "MarketPurchase"
    ADD CONSTRAINT "MarketPurchase_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
