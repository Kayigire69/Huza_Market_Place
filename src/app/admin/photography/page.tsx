import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminPhotographyClient } from "@/components/admin/AdminPhotographyClient";

export default async function AdminPhotographyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/photography")) redirect("/admin");

  return <AdminPhotographyClient />;
}
