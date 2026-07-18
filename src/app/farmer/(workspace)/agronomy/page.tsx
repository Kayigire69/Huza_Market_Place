import { FarmerAgronomyClient } from "@/components/portals/FarmerAgronomyClient";
import { FarmerPageHeader } from "@/components/portals/FarmerUi";

export default function FarmerAgronomyPage() {
  return (
    <div>
      <FarmerPageHeader
        title="Agronomy Support"
        subtitle="Request expert advice or a farm visit. Youth Huza helps you grow better — not only buys produce."
      />
      <FarmerAgronomyClient />
    </div>
  );
}
