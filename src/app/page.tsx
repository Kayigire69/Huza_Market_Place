import { catalogService } from "@/services/catalog.service";
import { HomePage } from "./HomeClient";

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

  const heroProducts = (featured.length >= 4 ? featured : shopProducts).slice(0, 4);

  return (
    <HomePage
      heroProducts={heroProducts}
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
