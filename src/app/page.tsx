import { HomePage } from "./HomeClient";
import { catalogService } from "@/services/catalog.service";

/** Cache home for a short window — catalogService also caches in Redis/memory. */
export const revalidate = 60;

export default async function Page() {
  const {
    shopProducts,
    featured,
    bestSellers,
    freshToday,
    categories,
    promotions,
    testimonials,
    isOpen,
  } = await catalogService.getHomeCatalog();

  return (
    <HomePage
      shopProducts={shopProducts}
      featured={featured.length ? featured : shopProducts.slice(0, 8)}
      bestSellers={bestSellers}
      freshToday={freshToday.length ? freshToday : shopProducts.slice(0, 8)}
      categories={categories}
      promotions={promotions}
      testimonials={testimonials}
      isOpen={isOpen}
    />
  );
}
