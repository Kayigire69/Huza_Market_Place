import { FarmerAgronomyClient } from "@/components/portals/FarmerAgronomyClient";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";

export default function FarmerAgronomyPage() {
  return (
    <div>
      <FarmerPageHeader title="Agronomy Support" />
      <FarmerAgronomyClient />
    </div>
  );
}
