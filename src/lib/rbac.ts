/** Role helpers for HUZA staff portals — Super Admin vs day-to-day Admin.
 * Must stay Edge/middleware-safe: no Node-only imports (auth, redis, prisma).
 */

export const ADMIN_PORTAL_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
export const SUPER_ADMIN_ONLY_PATHS = ["/admin/staff", "/admin/audit", "/admin/settings", "/admin/security"] as const;

export type AdminPortalRole = (typeof ADMIN_PORTAL_ROLES)[number];

export function isAdminPortalRole(role?: string | null): boolean {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN";
}

/** Staff / Audit / Settings — Super Admin only (normal Admin must not see these). */
export function isSuperAdminOnlyPath(pathname: string): boolean {
  return SUPER_ADMIN_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function canManageStaff(role?: string | null): boolean {
  return isSuperAdmin(role);
}

export function canViewAuditLogs(role?: string | null): boolean {
  return isSuperAdmin(role);
}

export function canEditSystemSettings(role?: string | null): boolean {
  return isSuperAdmin(role);
}
