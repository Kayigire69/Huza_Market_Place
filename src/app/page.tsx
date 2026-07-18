import { HomePage } from "./HomeClient";
import { catalogService } from "@/services/catalog.service";
import { getSetting } from "@/services/settings.service";
import { resolveWhatsAppUrl } from "@/lib/brand-contact";

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
    whatsappSetting,
  ] = await Promise.all([
    catalogService.getHomeCatalog(),
    getSetting("whatsapp_url", ""),
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
      whatsappUrl={resolveWhatsAppUrl(whatsappSetting)}
    />
  );
}
