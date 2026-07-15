-- Phase 5: structured quality feedback for farmers
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewRecommendation" TEXT;
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "recommendation" TEXT;
