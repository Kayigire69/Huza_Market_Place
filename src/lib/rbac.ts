/** Role helpers for HUZA staff portals. Edge / middleware safe (no Node-only imports). */

import {
  firstAllowedAdminPath,
  moduleForAdminPath,
  roleCanAccessModule,
} from "@/lib/admin-nav";

/** Anyone who may open the unified Admin Portal shell */
export const ADMIN_PORTAL_ROLES = [
  "ADMIN",
  "SUPER_ADMIN",
  "MANAGER",
  "INVENTORY",
  "WAREHOUSE",
  "SUPPORT",
  "PROCUREMENT",
  "FINANCE",
] as const;

export const SUPER_ADMIN_ONLY_PATHS = [
  "/admin/staff",
  "/admin/audit",
  "/admin/settings",
  "/admin/security",
  "/admin/hours",
] as const;

export type AdminPortalRole = (typeof ADMIN_PORTAL_ROLES)[number];

export function isAdminPortalRole(role?: string | null): boolean {
  return Boolean(role && (ADMIN_PORTAL_ROLES as readonly string[]).includes(role));
}

export function isSuperAdmin(role?: string | null): boolean {
  return role === "SUPER_ADMIN";
}

/** Confirm / fail / refund / sync customer payments. Not SUPPORT. */
const PAYMENT_MUTATION_ROLES = ["SUPER_ADMIN", "ADMIN", "MANAGER", "FINANCE"] as const;

export function canMutateCustomerPayments(role?: string | null): boolean {
  return Boolean(
    role && (PAYMENT_MUTATION_ROLES as readonly string[]).includes(role)
  );
}

/** Staff / Audit / Settings. Super Admin only */
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

/** Sidebar + middleware: can this role open this admin URL? */
export function canAccessAdminPath(role: string | null | undefined, pathname: string): boolean {
  if (!isAdminPortalRole(role)) return false;
  if (isSuperAdminOnlyPath(pathname) && !isSuperAdmin(role)) return false;
  const mod = moduleForAdminPath(pathname);
  if (!mod) return isSuperAdmin(role);
  return roleCanAccessModule(role, mod);
}

export { firstAllowedAdminPath };
