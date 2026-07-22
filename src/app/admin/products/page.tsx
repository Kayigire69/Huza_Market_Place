import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminProductsClient } from "@/components/admin/AdminProductsClient";

export default async function AdminProductsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/products", session.user.allowedModules)) redirect("/admin");

  return <AdminProductsClient />;
}
