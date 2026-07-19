import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminCropsClient } from "@/components/admin/AdminCropsClient";

export default async function AdminCropsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/crops")) redirect("/admin");

  return (
    <Suspense fallback={<p className="text-sm text-[var(--admin-muted)]">Loading crops…</p>}>
      <AdminCropsClient />
    </Suspense>
  );
}
