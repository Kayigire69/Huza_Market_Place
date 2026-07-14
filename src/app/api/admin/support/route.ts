import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminPortalRole } from "@/lib/rbac";
import { auditAdminAction } from "@/lib/audit";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminPortalRole(session.user.role)) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { fullName: true, phone: true, email: true } },
    },
  });

  return NextResponse.json({ tickets });
}

export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.adminReply !== undefined ? { adminReply: String(body.adminReply || "") } : {}),
    },
  });

  await auditAdminAction(req, session, {
    action: "support_ticket.update",
    entity: "SupportTicket",
    entityId: id,
    details: JSON.stringify({ status: body.status, hasReply: !!body.adminReply }),
  });

  return NextResponse.json(updated);
}
