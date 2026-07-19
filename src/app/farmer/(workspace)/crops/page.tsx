import { FarmerCropsClient } from "@/components/portals/FarmerCropsClient";
import { requireFarmerWorkspace } from "@/lib/farmer-workspace";

export const dynamic = "force-dynamic";

export default async function FarmerCropsPage() {
  await requireFarmerWorkspace();
  return <FarmerCropsClient />;
}
