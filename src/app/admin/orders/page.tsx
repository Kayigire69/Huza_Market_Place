import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminOrdersClient } from "@/components/admin/AdminOrdersClient";

export default async function AdminOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/orders")) redirect("/admin");

  return (
    <Suspense fallback={<p className="text-sm text-[var(--admin-muted)]">Loading orders…</p>}>
      <AdminOrdersClient />
    </Suspense>
  );
}
