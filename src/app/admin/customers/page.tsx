import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminCustomersClient } from "@/components/admin/AdminCustomersClient";

export default async function AdminCustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/customers", session.user.allowedModules)) redirect("/admin");

  return <AdminCustomersClient />;
}
