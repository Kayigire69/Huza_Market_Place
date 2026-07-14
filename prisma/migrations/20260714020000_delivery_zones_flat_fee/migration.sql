-- Align delivery zones: Kigali, Kamonyi, Bugesera @ 5000 RWF; drop Musanze if present
UPDATE "DeliveryZoneConfig"
SET "labelEn" = 'Kigali', "labelFr" = 'Kigali', "labelRw" = 'Kigali', "feeRwf" = 5000
WHERE "code" = 'KIGALI';

UPDATE "DeliveryZoneConfig"
SET "labelEn" = 'Kamonyi', "labelFr" = 'Kamonyi', "labelRw" = 'Kamonyi', "feeRwf" = 5000
WHERE "code" = 'KAMONYI_RUYENZI';

UPDATE "DeliveryZoneConfig"
SET "labelEn" = 'Bugesera', "labelFr" = 'Bugesera', "labelRw" = 'Bugesera', "feeRwf" = 5000
WHERE "code" = 'BUGESERA_NYAMATA';

DELETE FROM "DeliveryZoneConfig" WHERE "code" = 'MUSANZE';
