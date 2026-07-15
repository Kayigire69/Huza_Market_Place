import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { AdminAuditClient } from "@/components/admin/AdminAuditClient";

export default async function AdminAuditPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!isSuperAdmin(session.user.role)) redirect("/admin");

  return <AdminAuditClient />;
}
