import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminCategoriesClient } from "@/components/admin/AdminCategoriesClient";

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/categories", session.user.allowedModules)) redirect("/admin");

  return <AdminCategoriesClient />;
}
