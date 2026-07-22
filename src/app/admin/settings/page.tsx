import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath, isSuperAdmin } from "@/lib/rbac";
import { AdminSettingsClient } from "@/components/admin/AdminSettingsClient";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/settings", session.user.allowedModules)) redirect("/admin");

  return <AdminSettingsClient isSuperAdmin={isSuperAdmin(session.user.role)} />;
}
