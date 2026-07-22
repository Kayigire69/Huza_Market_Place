/**
 * Server-only RBAC helpers (uses next-auth + authOptions).
 * Do NOT import this from middleware. It pulls Node packages (Prisma, Redis, etc.).
 */
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleCanAccessModule, type AdminModule } from "@/lib/admin-nav";
import { isAdminPortalRole, isSuperAdmin } from "@/lib/rbac";

function rejectTempPassword(session: Session | null): Session | null {
  if (!session?.user) return null;
  if (session.user.mustChangePassword) return null;
  return session;
}

/**
 * Any admin-portal role, with temp-password blocked.
 * Prefer requireAdminSession({ modules }) when a module applies.
 */
export async function requirePortalSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminPortalRole(session.user.role)) return null;
  return rejectTempPassword(session);
}

/**
 * API guard: session must be an admin portal role, and optionally
 * must have access to at least one of the listed modules.
 * Super Admin always passes module checks.
 * Honors per-user allowedModules when set by Super Admin.
 */
export async function requireAdminSession(
  options?: { modules?: AdminModule[] }
): Promise<Session | null> {
  const session = await requirePortalSession();
  if (!session) return null;
  if (isSuperAdmin(session.user.role)) return session;
  if (options?.modules?.length) {
    const mods = session.user.allowedModules;
    const ok = options.modules.some((m) => roleCanAccessModule(session.user.role, m, mods));
    if (!ok) return null;
  }
  return session;
}

const WAREHOUSE_ROLES = new Set([
  "WAREHOUSE",
  "INVENTORY",
  "ADMIN",
  "SUPER_ADMIN",
  "MANAGER",
]);

const DELIVERY_ROLES = new Set([
  "DELIVERY",
  "ADMIN",
  "SUPER_ADMIN",
  "MANAGER",
]);

const PROCUREMENT_MSG_ROLES = new Set([
  "PROCUREMENT",
  "ADMIN",
  "SUPER_ADMIN",
  "MANAGER",
]);

export async function requireWarehouseSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !role || !WAREHOUSE_ROLES.has(role)) return null;
  return rejectTempPassword(session);
}

export async function requireDeliverySession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !role || !DELIVERY_ROLES.has(role)) return null;
  return rejectTempPassword(session);
}

export async function requireProcurementMessageSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  if (!session?.user || !role || !PROCUREMENT_MSG_ROLES.has(role)) return null;
  return rejectTempPassword(session);
}
