import { redirect } from "next/navigation";
import { FarmerSellClient } from "@/components/portals/FarmerSellClient";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerSellPage() {
  const { farmer } = await requireFarmerWorkspace();
  if (farmer.status !== "APPROVED") {
    redirect("/farmer/dashboard");
  }
  return <FarmerSellClient />;
}
