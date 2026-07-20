import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditAdminAction } from "@/lib/audit";
import { canManageStaff, isSuperAdmin } from "@/lib/rbac";
import { BCRYPT_ROUNDS } from "@/lib/security-access";

/** Roles Super Admin may create for employees (not Super Admin by default). */
const EMPLOYEE_ROLES: Role[] = [
  "ADMIN",
  "MANAGER",
  "WAREHOUSE",
  "INVENTORY",
  "DELIVERY",
  "PROCUREMENT",
  "SUPPORT",
  "FINANCE",
];

async function requireSuperAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !canManageStaff(session.user.role)) return null;
  return session;
}

/** List staff. Super Admin only. Normal Admin cannot see Employee Management. */
export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden. Super Admin only" }, { status: 403 });

  const staff = await prisma.user.findMany({
    where: {
      role: { in: [...EMPLOYEE_ROLES, Role.SUPER_ADMIN] },
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      isPrimarySuperAdmin: true,
      totpEnabled: true,
      mustChangePassword: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { fullName: "asc" }],
  });

  return NextResponse.json({ staff });
}

/** Create a personal staff login. Super Admin only. */
export async function POST(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden. Super Admin only" }, { status: 403 });

  const body = await req.json();
  const fullName = String(body.fullName || "").trim();
  const email = String(body.email || "").trim().toLowerCase() || null;
  const phone = String(body.phone || "").trim();
  let role = String(body.role || "ADMIN") as Role;
  const password = String(body.password || "");
  const promoteSuperAdmin = Boolean(body.promoteSuperAdmin);

  if (!fullName || phone.length < 8) {
    return NextResponse.json({ error: "Full name and phone are required" }, { status: 400 });
  }

  if (promoteSuperAdmin) {
    // Deliberate second Super Admin. Only an existing Super Admin can do this
    role = Role.SUPER_ADMIN;
  } else if (!EMPLOYEE_ROLES.includes(role)) {
    return NextResponse.json(
      { error: "Invalid employee role. Use promoteSuperAdmin to create another Super Admin." },
      { status: 400 }
    );
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
      passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
      isActive: true,
      mustChangePassword: true,
      isPrimarySuperAdmin: false,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      isPrimarySuperAdmin: true,
      createdAt: true,
    },
  });

  await auditAdminAction(req, session, {
    action: role === "SUPER_ADMIN" ? "staff.create_super_admin" : "staff.create",
    entity: "User",
    entityId: user.id,
    details: `Created ${user.role} for ${user.fullName} (${user.email || user.phone})`,
    after: {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });

  return NextResponse.json(user, { status: 201 });
}

/**
 * Update staff. Super Admin only.
 * Guards: cannot deactivate/delete/demote primary Super Admin; cannot target self destructively.
 */
export async function PATCH(req: Request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden. Super Admin only" }, { status: 403 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const before = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      isPrimarySuperAdmin: true,
    },
  });
  if (!before) {
    return NextResponse.json({ error: "Staff user not found" }, { status: 404 });
  }

  // Protect primary Super Admin and any Super Admin from normal Admin paths
  // (this route is already Super-Admin-only, but still block dangerous self/primary ops)
  if (before.isPrimarySuperAdmin) {
    if (body.isActive === false) {
      return NextResponse.json(
        { error: "The primary Super Admin account cannot be deactivated." },
        { status: 400 }
      );
    }
    if (body.role && body.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "The primary Super Admin role cannot be changed." },
        { status: 400 }
      );
    }
    if (body.delete) {
      return NextResponse.json(
        { error: "The primary Super Admin account cannot be deleted." },
        { status: 400 }
      );
    }
  }

  if (before.role === "SUPER_ADMIN" && id === session.user.id && body.isActive === false) {
    return NextResponse.json(
      { error: "You cannot deactivate your own Super Admin account." },
      { status: 400 }
    );
  }

  if (body.delete) {
    if (before.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Super Admin accounts cannot be deleted. Deactivate instead if needed." },
        { status: 400 }
      );
    }
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
    await auditAdminAction(req, session, {
      action: "staff.soft_delete",
      entity: "User",
      entityId: id,
      details: `Soft-deleted ${before.fullName}`,
      before,
      after: { isActive: false, deletedAt: true },
    });
    return NextResponse.json({ ok: true, id: user.id });
  }

  if (body.action === "reset_password" || body.resetPassword) {
    const password = String(body.password || "");
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Temporary password must be at least 8 characters" },
        { status: 400 }
      );
    }
    const user = await prisma.user.update({
      where: { id },
      data: {
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        mustChangePassword: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        mustChangePassword: true,
      },
    });
    await auditAdminAction(req, session, {
      action: "staff.reset_password",
      entity: "User",
      entityId: id,
      details: `Password reset for ${before.fullName}. Must change on next login`,
      before: { id: before.id, fullName: before.fullName },
      after: { mustChangePassword: true },
    });
    return NextResponse.json(user);
  }

  const nextRole =
    body.role && (EMPLOYEE_ROLES.includes(body.role) || body.role === "SUPER_ADMIN")
      ? (body.role as Role)
      : undefined;

  // Only Super Admin can promote to Super Admin (deliberate checkbox on create; here require explicit)
  if (nextRole === "SUPER_ADMIN" && !isSuperAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}),
      ...(nextRole ? { role: nextRole } : {}),
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      isActive: true,
      isPrimarySuperAdmin: true,
      mustChangePassword: true,
      totpEnabled: true,
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
