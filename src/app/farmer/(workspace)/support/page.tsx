import { FarmerComingSoon, FarmerPageHeader } from "@/components/portals/FarmerUi";

export default function FarmerSupportPage() {
  return (
    <div>
      <FarmerPageHeader
        title="Farmer Support"
        subtitle="Practical guides — organic tips, soil, pests, harvest timing, and HUZA quality standards."
      />
      <FarmerComingSoon
        title="Knowledge library coming next"
        body="Short, practical guides (not a big e-learning platform). Example: “How to Meet HUZA Quality Standards” — harvesting, handling, and cleanliness that reduce rejection."
        ctaHref="/farmer/dashboard"
        ctaLabel="Back to Dashboard"
      />
    </div>
  );
}
