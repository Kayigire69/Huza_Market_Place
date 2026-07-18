-- Procurement: buy vs commission deals + settlement fields

CREATE TYPE "ProcurementDealType" AS ENUM ('OUTRIGHT_BUY', 'COMMISSION');

ALTER TABLE "PurchaseOrder"
ADD COLUMN "dealType" "ProcurementDealType" NOT NULL DEFAULT 'OUTRIGHT_BUY',
ADD COLUMN "commissionRate" INTEGER,
ADD COLUMN "saleAmount" INTEGER,
ADD COLUMN "commissionAmount" INTEGER,
ADD COLUMN "farmerNetAmount" INTEGER;

CREATE INDEX "PurchaseOrder_dealType_idx" ON "PurchaseOrder"("dealType");

ALTER TABLE "Supplier"
ADD COLUMN "defaultCommissionRate" INTEGER DEFAULT 10;

ALTER TABLE "Product"
ADD COLUMN "ownershipMode" TEXT DEFAULT 'OWNED';
