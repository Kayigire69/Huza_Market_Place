import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FarmerPortalClient } from "./FarmerPortalClient";
import { FarmerPortalChrome } from "./FarmerPortalChrome";

export const dynamic = "force-dynamic";

const FARMER_DEMO = [
  {
    label: "Approved farmer — Green Valley Farm",
    email: "greenvalley@farm.rw",
    password: "password123",
    note: "List products with photos, manage inventory & profile",
  },
  {
    label: "Pending farmer — Sunrise Honey Co-op",
    email: "newfarm@example.rw",
    password: "password123",
    note: "Waiting for admin / agent approval",
  },
];

/**
 * Partner-only entry. Not linked from the customer storefront.
 * Guests see a login wall; registration is at /farmer/register (unlisted).
 */
export default async function FarmerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return <FarmerPortalChrome mode="landing" demoCredentials={FARMER_DEMO} />;
  }

  if (session.user.role !== "SUPPLIER" && session.user.role !== "ADMIN") {
    redirect("/account");
  }

  const farmer = await prisma.supplier.findFirst({
    where:
      session.user.role === "ADMIN" && !session.user.supplierId
        ? { status: "APPROVED" }
        : { userId: session.user.id },
    include: {
      user: { select: { fullName: true } },
      products: {
        include: {
          category: true,
          images: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!farmer) {
    return <FarmerPortalChrome mode="apply" />;
  }

  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  const listed = farmer.products.length;

  return (
    <FarmerPortalChrome
      mode="dashboard"
      businessName={farmer.businessName}
      status={farmer.status}
      isVerified={farmer.isVerified}
      farmingType={farmer.farmingType}
      rejectionReason={farmer.rejectionReason}
      adminNotes={farmer.adminNotes}
      inspectionScheduledAt={farmer.inspectionScheduledAt?.toISOString() ?? null}
      listed={listed}
    >
      <FarmerPortalClient farmer={farmer as never} categories={categories} />
    </FarmerPortalChrome>
  );
}
