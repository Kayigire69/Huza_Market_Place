import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { canAccessAdminPath } from "@/lib/rbac";
import { AdminWebsiteContentClient } from "@/components/admin/AdminWebsiteContentClient";

export const dynamic = "force-dynamic";

export default async function AdminWebsiteContentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");
  if (!canAccessAdminPath(session.user.role, "/admin/website-content", session.user.allowedModules)) redirect("/admin");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--admin-ink)]">Website Content</h1>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">
          Manage HUZA FRESH Customer Website hero banners and category translations.
        </p>
      </div>
      <AdminWebsiteContentClient />
    </div>
  );
}
