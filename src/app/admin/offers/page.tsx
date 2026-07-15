import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminPromotionsClient } from "@/components/admin/AdminPromotionsClient";

export default async function AdminOffersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/offers")) redirect("/admin");

  return <AdminPromotionsClient />;
}
