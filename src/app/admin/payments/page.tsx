import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminPaymentsClient } from "@/components/admin/AdminPaymentsClient";

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/payments")) redirect("/admin");

  return (
    <Suspense fallback={<p className="text-sm text-[var(--admin-muted)]">Loading payments…</p>}>
      <AdminPaymentsClient />
    </Suspense>
  );
}
