import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (body.type === "emergency") {
    await prisma.emergencyClosure.updateMany({ data: { isActive: false } });
    const closure = await prisma.emergencyClosure.create({
      data: { reason: body.reason || "Emergency closure", isActive: true },
    });
    await auditAdminAction(req, session, {
      action: "hours.emergency_activate",
      entity: "EmergencyClosure",
      entityId: closure.id,
      details: closure.reason,
      before: { isActive: false },
      after: { isActive: true, reason: closure.reason },
    });
    return NextResponse.json(closure);
  }

  if (body.type === "holiday") {
    const holiday = await prisma.holiday.create({
      data: {
        date: new Date(body.date),
        name: body.name,
        isClosed: true,
      },
    });
    await auditAdminAction(req, session, {
      action: "hours.holiday_add",
      entity: "Holiday",
      entityId: holiday.id,
      details: `${holiday.name} on ${holiday.date.toISOString().slice(0, 10)}`,
      after: { name: holiday.name, date: holiday.date, isClosed: holiday.isClosed },
    });
    return NextResponse.json(holiday);
  }

  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}
