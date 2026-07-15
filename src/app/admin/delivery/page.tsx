import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminDeliveriesClient } from "@/components/admin/AdminDeliveriesClient";

export default async function AdminDeliveryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/delivery")) redirect("/admin");

  return <AdminDeliveriesClient />;
}
