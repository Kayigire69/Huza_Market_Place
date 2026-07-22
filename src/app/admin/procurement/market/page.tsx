import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminMarketProcurementClient } from "@/components/admin/AdminMarketProcurementClient";

export default async function AdminMarketProcurementPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/procurement/market", session.user.allowedModules)) redirect("/admin");

  return <AdminMarketProcurementClient />;
}
