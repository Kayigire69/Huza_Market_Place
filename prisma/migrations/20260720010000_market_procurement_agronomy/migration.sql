-- AlterEnum
ALTER TYPE "ProcurementDealType" ADD VALUE IF NOT EXISTS 'MARKET_BUY';

-- AlterTable PurchaseOrder
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "qualityGrade" TEXT;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "MarketPurchaseStatus" AS ENUM ('RECORDED', 'INSPECTED', 'STOCKED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AgronomyRequestKind" AS ENUM ('ADVICE', 'VISIT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AgronomyRequestStatus" AS ENUM ('OPEN', 'REPLIED', 'SCHEDULED', 'HANDLED', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AgronomyFollowUpType" AS ENUM ('VISIT', 'RECOMMENDATION', 'DISEASE', 'PEST', 'SOIL', 'TRAINING', 'NOTE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable MarketPurchase
CREATE TABLE IF NOT EXISTS "MarketPurchase" (
    "id" TEXT NOT NULL,
    "purchaseNumber" TEXT NOT NULL,
    "marketName" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT,
    "unit" "UnitType" NOT NULL DEFAULT 'KG',
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" INTEGER NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "retailPrice" INTEGER,
    "qualityGrade" TEXT,
    "inspectionNotes" TEXT,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "MarketPurchaseStatus" NOT NULL DEFAULT 'RECORDED',
    "productId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "inspectedAt" TIMESTAMP(3),
    "stockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketPurchase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MarketPurchase_purchaseNumber_key" ON "MarketPurchase"("purchaseNumber");
CREATE INDEX IF NOT EXISTS "MarketPurchase_status_idx" ON "MarketPurchase"("status");
CREATE INDEX IF NOT EXISTS "MarketPurchase_purchaseDate_idx" ON "MarketPurchase"("purchaseDate");
CREATE INDEX IF NOT EXISTS "MarketPurchase_marketName_idx" ON "MarketPurchase"("marketName");

-- CreateTable AgronomyRequest
CREATE TABLE IF NOT EXISTS "AgronomyRequest" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "kind" "AgronomyRequestKind" NOT NULL,
    "crop" TEXT NOT NULL,
    "topicOrReason" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "status" "AgronomyRequestStatus" NOT NULL DEFAULT 'OPEN',
    "adminReply" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "handledAt" TIMESTAMP(3),
    "handledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgronomyRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AgronomyRequest_supplierId_idx" ON "AgronomyRequest"("supplierId");
CREATE INDEX IF NOT EXISTS "AgronomyRequest_status_idx" ON "AgronomyRequest"("status");
CREATE INDEX IF NOT EXISTS "AgronomyRequest_kind_idx" ON "AgronomyRequest"("kind");
CREATE INDEX IF NOT EXISTS "AgronomyRequest_createdAt_idx" ON "AgronomyRequest"("createdAt");

-- CreateTable AgronomyFollowUp
CREATE TABLE IF NOT EXISTS "AgronomyFollowUp" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" "AgronomyFollowUpType" NOT NULL,
    "notes" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "AgronomyFollowUp_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AgronomyFollowUp_requestId_idx" ON "AgronomyFollowUp"("requestId");
CREATE INDEX IF NOT EXISTS "AgronomyFollowUp_type_idx" ON "AgronomyFollowUp"("type");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "AgronomyRequest" ADD CONSTRAINT "AgronomyRequest_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "AgronomyFollowUp" ADD CONSTRAINT "AgronomyFollowUp_requestId_fkey"
    FOREIGN KEY ("requestId") REFERENCES "AgronomyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
