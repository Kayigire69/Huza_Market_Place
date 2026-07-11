-- Human-readable delivery ETA ranges (admin-editable)
ALTER TABLE "DeliveryZoneConfig" ADD COLUMN IF NOT EXISTS "etaLabelEn" TEXT NOT NULL DEFAULT '';

UPDATE "DeliveryZoneConfig" SET "etaLabelEn" = '45–90 minutes', "etaMinutes" = 90, "feeRwf" = 5000 WHERE "code" = 'KIGALI';
UPDATE "DeliveryZoneConfig" SET "etaLabelEn" = '2–3 hours', "etaMinutes" = 180, "feeRwf" = 5000 WHERE "code" = 'KAMONYI_RUYENZI';
UPDATE "DeliveryZoneConfig" SET "etaLabelEn" = '2–3 hours', "etaMinutes" = 180, "feeRwf" = 5000 WHERE "code" = 'BUGESERA_NYAMATA';
