import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { AdminStaffClient } from "@/components/admin/AdminStaffClient";

export default async function AdminStaffPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!isSuperAdmin(session.user.role)) redirect("/admin");

  return <AdminStaffClient />;
}
