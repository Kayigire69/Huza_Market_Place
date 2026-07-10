-- AlterTable Supplier: verification fields (safe if already present via db push)
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "sector" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "nationalId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "companyRegNo" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "tin" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "farmSize" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "productionCapacity" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "productCategories" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "paymentMomo" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "bankAccount" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "bankName" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "nationalIdUrl" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "businessCertUrl" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "tinDocUrl" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "foodSafetyUrl" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "organicCertUrl" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "permitUrl" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "documentsUrl" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "inspectionScheduledAt" TIMESTAMP(3);

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'ORDERED', 'RECEIVED', 'INSPECTED', 'ACCEPTED', 'REJECTED', 'PAID', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "poNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "offerId" TEXT,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "unit" "UnitType" NOT NULL DEFAULT 'KG',
    "quantity" DOUBLE PRECISION NOT NULL,
    "negotiatedPrice" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "retailPrice" INTEGER,
    "qualityNotes" TEXT,
    "rejectionReason" TEXT,
    "paymentRef" TEXT,
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "orderedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "inspectedAt" TIMESTAMP(3),
    "notes" TEXT,
    "productId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_poNumber_idx" ON "PurchaseOrder"("poNumber");

DO $$ BEGIN
  ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "SupplierOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
