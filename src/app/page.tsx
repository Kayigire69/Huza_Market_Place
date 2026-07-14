import { HomePage } from "./HomeClient";
import { catalogService } from "@/services/catalog.service";

/** Cache home for a short window — catalogService also caches in Redis/memory. */
export const revalidate = 90;

export default async function Page() {
  const {
    featured,
    bestSellers,
    freshToday,
    categoryPreviews,
    categories,
    promotions,
    testimonials,
    isOpen,
  } = await catalogService.getHomeCatalog();

  return (
    <HomePage
      featured={featured}
      bestSellers={bestSellers}
      freshToday={freshToday}
      categoryPreviews={categoryPreviews}
      categories={categories}
      promotions={promotions}
      testimonials={testimonials}
      isOpen={isOpen}
    />
  );
}
