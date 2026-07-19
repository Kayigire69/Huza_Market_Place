import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminAgronomyClient } from "@/components/admin/AdminAgronomyClient";

export default async function AdminAgronomyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/agronomy")) redirect("/admin");

  return <AdminAgronomyClient />;
}
