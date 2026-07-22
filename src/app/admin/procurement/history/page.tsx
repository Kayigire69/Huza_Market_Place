import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminProcurementClient } from "@/components/admin/AdminProcurementClient";

export default async function ProcurementHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/procurement/history", session.user.allowedModules)) redirect("/admin");

  return <AdminProcurementClient view="history" />;
}
