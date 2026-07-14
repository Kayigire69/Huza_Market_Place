import { HomePage } from "./HomeClient";
import { catalogService } from "@/services/catalog.service";
import { getSetting } from "@/services/settings.service";

/** Cache home for a short window — catalogService also caches in Redis/memory. */
export const revalidate = 90;

export default async function Page() {
  const [
    {
      categories,
      popularNow,
      readyToEat,
      promotions,
      testimonials,
      customerReviews,
      isOpen,
    },
    whatsappUrl,
  ] = await Promise.all([
    catalogService.getHomeCatalog(),
    getSetting("whatsapp_url", "https://wa.me/250788000000"),
  ]);

  return (
    <HomePage
      categories={categories}
      popularNow={popularNow}
      readyToEat={readyToEat}
      promotions={promotions}
      testimonials={testimonials}
      customerReviews={customerReviews}
      isOpen={isOpen}
      whatsappUrl={whatsappUrl}
    />
  );
}
