import { FarmerSellClient } from "@/components/portals/FarmerSellClient";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerSellPage() {
  await requireFarmerWorkspace();
  return <FarmerSellClient />;
}
