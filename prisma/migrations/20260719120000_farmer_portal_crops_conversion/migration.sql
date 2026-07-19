-- AlterEnum
ALTER TYPE "FarmingType" ADD VALUE IF NOT EXISTS 'CONVERSION';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'HARVEST_ALERT';

-- CreateTable
CREATE TABLE IF NOT EXISTS "FarmCrop" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "plantingDate" TIMESTAMP(3),
    "expectedHarvestDate" TIMESTAMP(3),
    "expectedQty" INTEGER,
    "actualQty" INTEGER,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "growthStage" TEXT,
    "farmStatus" TEXT,
    "fertilizerUsed" TEXT,
    "pesticidesUsed" TEXT,
    "diseases" TEXT,
    "pests" TEXT,
    "irrigation" TEXT,
    "notes" TEXT,
    "productId" TEXT,
    "harvestAlertSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmCrop_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "FarmCrop_supplierId_idx" ON "FarmCrop"("supplierId");
CREATE INDEX IF NOT EXISTS "FarmCrop_expectedHarvestDate_idx" ON "FarmCrop"("expectedHarvestDate");

DO $$ BEGIN
 ALTER TABLE "FarmCrop" ADD CONSTRAINT "FarmCrop_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 ALTER TABLE "FarmCrop" ADD CONSTRAINT "FarmCrop_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
