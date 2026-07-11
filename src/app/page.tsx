import { HomePage } from "./HomeClient";
import { catalogService } from "@/services/catalog.service";

export const dynamic = "force-dynamic";

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
