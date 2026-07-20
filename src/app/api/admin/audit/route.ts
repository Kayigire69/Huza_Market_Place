import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/rbac";
import { Prisma } from "@prisma/client";

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isSuperAdmin(session.user.role)) return null;
  return session;
}

export async function GET(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden. Super Admin only" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") || "audit";
  const q = searchParams.get("q")?.trim() || "";
  const action = searchParams.get("action")?.trim() || "";
  const take = Math.min(Number(searchParams.get("take") || 80) || 80, 200);

  if (tab === "errors") {
    const where: Prisma.ErrorLogWhereInput = q
      ? {
          OR: [
            { message: { contains: q, mode: "insensitive" } },
            { source: { contains: q, mode: "insensitive" } },
            { path: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};
    const errors = await prisma.errorLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    });
    return NextResponse.json({ errors });
  }

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
    ...(q
      ? {
          OR: [
            { actorName: { contains: q, mode: "insensitive" } },
            { actorEmail: { contains: q, mode: "insensitive" } },
            { action: { contains: q, mode: "insensitive" } },
            { entity: { contains: q, mode: "insensitive" } },
            { details: { contains: q, mode: "insensitive" } },
            { entityId: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [logs, actions] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: true,
      orderBy: { _count: { action: "desc" } },
      take: 30,
    }),
  ]);

  return NextResponse.json({
    logs,
    actionCounts: actions.map((a) => ({ action: a.action, count: a._count })),
  });
}
