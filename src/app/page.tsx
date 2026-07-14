import { HomePage } from "./HomeClient";
import { catalogService } from "@/services/catalog.service";

/** Cache home for a short window — catalogService also caches in Redis/memory. */
export const revalidate = 90;

export default async function Page() {
  const {
    categories,
    categoryPreviews,
    popularNow,
    readyToEat,
    promotions,
    testimonials,
    isOpen,
  } = await catalogService.getHomeCatalog();

  return (
    <HomePage
      categories={categories}
      categoryPreviews={categoryPreviews}
      popularNow={popularNow}
      readyToEat={readyToEat}
      promotions={promotions}
      testimonials={testimonials}
      isOpen={isOpen}
    />
  );
}
