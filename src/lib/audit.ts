import { prisma } from "./prisma";

export async function writeAuditLog(input: {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId || null,
        actorName: input.actorName || null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId || null,
        details: input.details || null,
        ipAddress: input.ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Audit log failed", err);
  }
}
