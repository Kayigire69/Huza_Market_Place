import { FarmerComingSoon, FarmerPageHeader } from "@/components/portals/FarmerUi";

export default function FarmerAgronomistPage() {
  return (
    <div>
      <FarmerPageHeader title="Ask an Agronomist" />
      <FarmerComingSoon
        title="Expert Q&A coming next"
        body='Example: “My tomato leaves are turning yellow. What should I do?” Get clear compost, watering, and nutrient advice.'
        ctaHref="/farmer/products/submit"
        ctaLabel="Submit Product"
      />
    </div>
  );
}
