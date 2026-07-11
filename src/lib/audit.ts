import type { Session } from "next-auth";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { clientIp } from "./rate-limit";

export type AuditInput = {
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
};

function toJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
  if (value === undefined) return undefined;
  if (value === null) return Prisma.JsonNull;
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
  } catch {
    return { note: "unserializable" } as Prisma.InputJsonValue;
  }
}

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId || null,
        actorName: input.actorName || null,
        actorEmail: input.actorEmail || null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId || null,
        details: input.details || null,
        beforeJson: toJson(input.before),
        afterJson: toJson(input.after),
        ipAddress: input.ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Audit log failed", err);
  }
}

/** Attribute an admin action to the logged-in staff member + request IP. */
export async function auditAdminAction(
  req: Request,
  session: Session,
  input: Omit<AuditInput, "actorId" | "actorName" | "actorEmail" | "ipAddress">
) {
  return writeAuditLog({
    ...input,
    actorId: session.user.id,
    actorName: session.user.name || "Staff",
    actorEmail: session.user.email || null,
    ipAddress: clientIp(req),
  });
}
