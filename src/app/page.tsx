import { HomePage } from "./HomeClient";
import { catalogService } from "@/services/catalog.service";

/** Cache home for a short window — catalogService also caches in Redis/memory. */
export const revalidate = 90;

export default async function Page() {
  const {
    categories,
    popularNow,
    readyToEat,
    promotions,
    testimonials,
    isOpen,
  } = await catalogService.getHomeCatalog();

  return (
    <HomePage
      categories={categories}
      popularNow={popularNow}
      readyToEat={readyToEat}
      promotions={promotions}
      testimonials={testimonials}
      isOpen={isOpen}
    />
  );
}
