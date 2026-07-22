-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "procurementMarketName" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "procurementFarmName" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "procurementFarmerName" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "procurementPurchaseDate" TIMESTAMP(3);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "purchasedById" TEXT;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Product_purchasedById_fkey'
  ) THEN
    ALTER TABLE "Product"
      ADD CONSTRAINT "Product_purchasedById_fkey"
      FOREIGN KEY ("purchasedById") REFERENCES "User"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Product_purchasedById_idx" ON "Product"("purchasedById");
