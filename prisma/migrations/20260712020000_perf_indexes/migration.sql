-- Speed up storefront / admin filters and joins (no schema behavior change)
CREATE INDEX IF NOT EXISTS "Product_isActive_deletedAt_idx" ON "Product"("isActive", "deletedAt");
CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX IF NOT EXISTS "Product_isFeatured_isActive_idx" ON "Product"("isFeatured", "isActive");
CREATE INDEX IF NOT EXISTS "Product_isBestSeller_isActive_idx" ON "Product"("isBestSeller", "isActive");
CREATE INDEX IF NOT EXISTS "Product_isNewArrival_isActive_idx" ON "Product"("isNewArrival", "isActive");
CREATE INDEX IF NOT EXISTS "Product_stockQty_idx" ON "Product"("stockQty");
CREATE INDEX IF NOT EXISTS "Product_nameEn_idx" ON "Product"("nameEn");
CREATE INDEX IF NOT EXISTS "Product_ratingAvg_idx" ON "Product"("ratingAvg");

CREATE INDEX IF NOT EXISTS "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_userId_createdAt_idx" ON "Order"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");

CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX IF NOT EXISTS "OrderItem_productId_idx" ON "OrderItem"("productId");

CREATE INDEX IF NOT EXISTS "Review_productId_isHidden_idx" ON "Review"("productId", "isHidden");
CREATE INDEX IF NOT EXISTS "Review_userId_idx" ON "Review"("userId");
