import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminApprovalsClient } from "@/components/admin/AdminApprovalsClient";

export default async function AdminApprovalsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/approvals")) redirect("/admin");

  return <AdminApprovalsClient />;
}
