-- Roles
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'WAREHOUSE';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PROCUREMENT';
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPPORT';

-- Order statuses
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PACKED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_DISPATCH';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETURNED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

-- Payment methods
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CASH_ON_DELIVERY';
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CARD';

-- Notification types
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_PACKED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_OUT_FOR_DELIVERY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ORDER_DELIVERED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PO_RECEIVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PAYMENT_PROCESSED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'DELIVERY_SCHEDULE';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'NEW_SUPPLIER';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FAILED_PAYMENT';

DO $$ BEGIN
  CREATE TYPE "DeliverySlot" AS ENUM ('TODAY', 'TOMORROW', 'SCHEDULED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "ReviewType" AS ENUM ('PRODUCT', 'DELIVERY', 'EXPERIENCE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "TicketType" AS ENUM ('GENERAL', 'COMPLAINT', 'RETURN', 'REFUND', 'CALL_REQUEST');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "StockMovementType" AS ENUM ('RECEIVE', 'SALE', 'ADJUST', 'DAMAGE', 'RETURN', 'TRANSFER', 'COUNT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "referredBy" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_referralCode_key" ON "User"("referralCode");

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "nutritionalInfo" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "originDistrict" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "barcode" TEXT;

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliverySlot" "DeliverySlot" NOT NULL DEFAULT 'TODAY';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "estimatedDelivery" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "promoCode" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmt" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "packedAt" TIMESTAMP(3);

ALTER TABLE "Delivery" ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;
ALTER TABLE "Delivery" ADD COLUMN IF NOT EXISTS "routeNotes" TEXT;
ALTER TABLE "Delivery" ADD COLUMN IF NOT EXISTS "podPhotoUrl" TEXT;
ALTER TABLE "Delivery" ADD COLUMN IF NOT EXISTS "podSignatureUrl" TEXT;
ALTER TABLE "Delivery" ADD COLUMN IF NOT EXISTS "podNotes" TEXT;

ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "orderId" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "type" "ReviewType" NOT NULL DEFAULT 'PRODUCT';
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "adminReply" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "repliedById" TEXT;
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3);

ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "isLoyalty" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "loyaltyPoints" INTEGER;
ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "isMembership" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "isReferral" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Promotion" ADD COLUMN IF NOT EXISTS "referralBonus" INTEGER;

CREATE TABLE IF NOT EXISTS "Vehicle" (
  "id" TEXT NOT NULL,
  "plateNumber" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "capacityKg" INTEGER,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

DO $$ BEGIN
  ALTER TABLE "Delivery" ADD CONSTRAINT "Delivery_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "Review" ADD CONSTRAINT "Review_repliedById_fkey" FOREIGN KEY ("repliedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "WarehouseLocation" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "zone" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WarehouseLocation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "WarehouseLocation_code_key" ON "WarehouseLocation"("code");

CREATE TABLE IF NOT EXISTS "StockBatch" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "batchNumber" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "expiryDate" TIMESTAMP(3),
  "locationId" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT,
  CONSTRAINT "StockBatch_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StockBatch_productId_idx" ON "StockBatch"("productId");
CREATE INDEX IF NOT EXISTS "StockBatch_batchNumber_idx" ON "StockBatch"("batchNumber");
DO $$ BEGIN
  ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "StockBatch" ADD CONSTRAINT "StockBatch_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "WarehouseLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "GoodsReceipt" (
  "id" TEXT NOT NULL,
  "receiptNumber" TEXT NOT NULL,
  "purchaseOrderId" TEXT,
  "supplierId" TEXT NOT NULL,
  "receivedById" TEXT,
  "notes" TEXT,
  "damageNotes" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoodsReceipt_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "GoodsReceipt_receiptNumber_key" ON "GoodsReceipt"("receiptNumber");
DO $$ BEGIN
  ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "GoodsReceipt" ADD CONSTRAINT "GoodsReceipt_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "GoodsReceiptItem" (
  "id" TEXT NOT NULL,
  "goodsReceiptId" TEXT NOT NULL,
  "productId" TEXT,
  "productName" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" "UnitType" NOT NULL DEFAULT 'KG',
  "batchNumber" TEXT,
  "expiryDate" TIMESTAMP(3),
  "damagedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "locationCode" TEXT,
  CONSTRAINT "GoodsReceiptItem_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_goodsReceiptId_fkey" FOREIGN KEY ("goodsReceiptId") REFERENCES "GoodsReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "GoodsReceiptItem" ADD CONSTRAINT "GoodsReceiptItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "StockMovement" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "type" "StockMovementType" NOT NULL,
  "quantity" INTEGER NOT NULL,
  "reason" TEXT,
  "actorId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StockMovement_productId_idx" ON "StockMovement"("productId");
CREATE INDEX IF NOT EXISTS "StockMovement_type_idx" ON "StockMovement"("type");
DO $$ BEGIN
  ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "NewsletterSubscriber" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");

CREATE TABLE IF NOT EXISTS "SupportTicket" (
  "id" TEXT NOT NULL,
  "ticketNumber" TEXT NOT NULL,
  "userId" TEXT,
  "guestName" TEXT,
  "guestPhone" TEXT,
  "type" "TicketType" NOT NULL DEFAULT 'GENERAL',
  "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "orderNumber" TEXT,
  "adminReply" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");
DO $$ BEGIN
  ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "ReturnRequest" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "refundAmt" INTEGER,
  "adminNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReturnRequest_pkey" PRIMARY KEY ("id")
);
DO $$ BEGIN
  ALTER TABLE "ReturnRequest" ADD CONSTRAINT "ReturnRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "ProcurementMessage" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "senderRole" TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProcurementMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ProcurementMessage_supplierId_idx" ON "ProcurementMessage"("supplierId");
DO $$ BEGIN
  ALTER TABLE "ProcurementMessage" ADD CONSTRAINT "ProcurementMessage_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "Expense" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "notes" TEXT,
  "incurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
