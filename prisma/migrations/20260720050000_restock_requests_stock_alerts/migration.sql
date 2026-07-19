-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'RESTOCK_REQUEST';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "RestockRequestStatus" AS ENUM ('OPEN', 'SOURCING', 'FULFILLED', 'CLOSED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "RestockRequest" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT,
    "quantityWanted" INTEGER,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "note" TEXT,
    "status" "RestockRequestStatus" NOT NULL DEFAULT 'OPEN',
    "softEtaLabel" TEXT NOT NULL DEFAULT 'Usually within a few hours in Kigali',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestockRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RestockRequest_productId_status_idx" ON "RestockRequest"("productId", "status");
CREATE INDEX IF NOT EXISTS "RestockRequest_status_createdAt_idx" ON "RestockRequest"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "RestockRequest_createdAt_idx" ON "RestockRequest"("createdAt");

CREATE TABLE IF NOT EXISTS "StockAlertLog" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "available" INTEGER NOT NULL,
    "percentLeft" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockAlertLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "StockAlertLog_productId_kind_sentAt_idx" ON "StockAlertLog"("productId", "kind", "sentAt");
CREATE INDEX IF NOT EXISTS "StockAlertLog_sentAt_idx" ON "StockAlertLog"("sentAt");

DO $$ BEGIN
  ALTER TABLE "RestockRequest" ADD CONSTRAINT "RestockRequest_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "RestockRequest" ADD CONSTRAINT "RestockRequest_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "StockAlertLog" ADD CONSTRAINT "StockAlertLog_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
