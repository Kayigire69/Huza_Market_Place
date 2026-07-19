import { FarmerGrowBetterClient } from "@/components/portals/FarmerGrowBetterClient";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function GrowBetterPage() {
  await requireFarmerWorkspace();
  return <FarmerGrowBetterClient />;
}
