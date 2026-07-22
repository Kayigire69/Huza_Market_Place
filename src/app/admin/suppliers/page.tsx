import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminFarmersClient } from "@/components/admin/AdminFarmersClient";

export default async function AdminFarmersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/suppliers", session.user.allowedModules)) redirect("/admin");

  return <AdminFarmersClient />;
}
