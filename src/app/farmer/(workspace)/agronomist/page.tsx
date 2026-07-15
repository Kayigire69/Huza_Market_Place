import { FarmerComingSoon, FarmerPageHeader } from "@/components/portals/FarmerUi";

export default function FarmerAgronomistPage() {
  return (
    <div>
      <FarmerPageHeader
        title="Ask an Agronomist"
        subtitle="Send a question, photo, or crop issue — Youth Huza agronomists reply with practical advice."
      />
      <FarmerComingSoon
        title="Expert Q&A coming next"
        body='Example: “My tomato leaves are turning yellow. What should I do?” → clear compost, watering, and nutrient guidance without changing your selling workflow.'
        ctaHref="/farmer/products/submit"
        ctaLabel="Continue selling — Submit Product"
      />
    </div>
  );
}
