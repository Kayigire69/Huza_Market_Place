import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminInventoryClient } from "@/components/admin/AdminInventoryClient";

export default async function AdminInventoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/inventory", session.user.allowedModules)) redirect("/admin");

  return (
    <Suspense fallback={<p className="text-sm text-[var(--admin-muted)]">Loading inventory…</p>}>
      <AdminInventoryClient />
    </Suspense>
  );
}
