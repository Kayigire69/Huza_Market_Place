import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { AdminCleanupClient } from "@/components/admin/AdminCleanupClient";

export default async function AdminCleanupPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!isSuperAdmin(session.user.role)) redirect("/admin");

  return <AdminCleanupClient />;
}
