/**
 * Server-only RBAC helpers (uses next-auth + authOptions).
 * Do NOT import this from middleware — it pulls Node packages (Prisma, Redis, etc.).
 */
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleCanAccessModule, type AdminModule } from "@/lib/admin-nav";
import { isAdminPortalRole, isSuperAdmin } from "@/lib/rbac";

/**
 * API guard: session must be an admin portal role, and optionally
 * must have access to at least one of the listed modules.
 * Super Admin always passes module checks.
 */
export async function requireAdminSession(
  options?: { modules?: AdminModule[] }
): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isAdminPortalRole(session.user.role)) return null;
  if (isSuperAdmin(session.user.role)) return session;
  if (options?.modules?.length) {
    const ok = options.modules.some((m) => roleCanAccessModule(session.user.role, m));
    if (!ok) return null;
  }
  return session;
}
