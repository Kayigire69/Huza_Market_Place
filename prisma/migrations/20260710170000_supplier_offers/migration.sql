CREATE TYPE "OfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'PURCHASED');

CREATE TABLE IF NOT EXISTS "SupplierOffer" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "categoryId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "unit" "UnitType" NOT NULL DEFAULT 'KG',
    "quantityOffered" DOUBLE PRECISION NOT NULL,
    "askPrice" INTEGER NOT NULL,
    "suggestedRetail" INTEGER,
    "availableDistricts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "OfferStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "purchasedQty" DOUBLE PRECISION,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SupplierOffer_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
 ALTER TABLE "SupplierOffer" ADD CONSTRAINT "SupplierOffer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
 ALTER TABLE "SupplierOffer" ADD CONSTRAINT "SupplierOffer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
