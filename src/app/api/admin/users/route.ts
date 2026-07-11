import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";

const STAFF_ROLES: Role[] = ["ADMIN", "WAREHOUSE", "DELIVERY", "PROCUREMENT", "SUPPORT"];

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

/** List staff accounts — never share one admin login across shifts. */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const staff = await prisma.user.findMany({
    where: { role: { in: STAFF_ROLES } },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  });

  return NextResponse.json({ staff });
}

/** Create a personal staff login for shift accountability. */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase() || null;
  const phone = String(body.phone || "").trim();
  const role = String(body.role || "ADMIN") as Role;
  const password = String(body.password || "");

  if (!fullName || phone.length < 8) {
    return NextResponse.json({ error: "Full name and phone are required" }, { status: 400 });
  }
  if (!STAFF_ROLES.includes(role)) {
    return NextResponse.json({ error: "Invalid staff role" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ phone }, ...(email ? [{ email }] : [])],
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Phone or email already registered" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      phone,
      role,
      passwordHash: await bcrypt.hash(password, 10),
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await auditAdminAction(req, session, {
    action: "staff.create",
    entity: "User",
    entityId: user.id,
    details: `Created ${user.role} account for ${user.fullName} (${user.email || user.phone})`,
    after: {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });

  return NextResponse.json(user, { status: 201 });
}

/** Activate / deactivate a staff account (never delete history). */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
  }

  const before = await prisma.user.findUnique({
    where: { id },
    select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true },
  });
  if (!before || !STAFF_ROLES.includes(before.role)) {
    return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      ...(body.role && STAFF_ROLES.includes(body.role) ? { role: body.role as Role } : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  await auditAdminAction(req, session, {
    action: "staff.update",
    entity: "User",
    entityId: user.id,
    details: `Updated ${user.fullName}: active=${user.isActive} role=${user.role}`,
    before,
    after: user,
  });

  return NextResponse.json(user);
}
