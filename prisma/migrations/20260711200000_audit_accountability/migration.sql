-- Multi-admin accountability: who / email / before / after
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actorEmail" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "beforeJson" JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "afterJson" JSONB;

CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
