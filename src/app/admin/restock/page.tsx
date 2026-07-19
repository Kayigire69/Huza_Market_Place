import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminRestockClient } from "@/components/admin/AdminRestockClient";

export default async function AdminRestockPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/restock")) redirect("/admin");

  return <AdminRestockClient />;
}
