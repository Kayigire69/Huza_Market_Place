import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FarmerPortalChrome } from "./FarmerPortalChrome";

export const dynamic = "force-dynamic";

/**
 * Partner entry. Guests see login/apply.
 * Approved suppliers enter the Phase 1 workspace at /farmer/dashboard.
 */
export default async function FarmerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <FarmerPortalChrome mode="landing" />;
  }

  if (
    session.user.role !== "SUPPLIER" &&
    session.user.role !== "ADMIN" &&
    session.user.role !== "SUPER_ADMIN"
  ) {
    redirect("/account");
  }

  const farmer = await prisma.supplier.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!farmer) {
    if (session.user.role === "ADMIN" || session.user.role === "SUPER_ADMIN") {
      redirect("/admin");
    }
    return <FarmerPortalChrome mode="apply" />;
  }

  redirect("/farmer/dashboard");
}
