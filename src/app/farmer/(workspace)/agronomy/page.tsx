import { FarmerAgronomyClient } from "@/components/portals/FarmerAgronomyClient";
import { FarmerI18nHeader } from "@/components/portals/FarmerI18nHeader";

export default function FarmerAgronomyPage() {
  return (
    <div>
      <FarmerI18nHeader titleKey="navAgronomy" />
      <FarmerAgronomyClient />
    </div>
  );
}
