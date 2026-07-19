import { HomePage } from "./HomeClient";
import { catalogService } from "@/services/catalog.service";
import { getSetting } from "@/services/settings.service";
import { resolveWhatsAppUrl } from "@/lib/brand-contact";

/** Always read live catalog after seed — avoid a permanently empty static homepage. */
export const dynamic = "force-dynamic";

function isMissingTableError(err: unknown): boolean {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code)
      : "";
  const message = err instanceof Error ? err.message : String(err ?? "");
  return code === "P2021" || /does not exist|relation .* not found/i.test(message);
}

export default async function Page() {
  try {
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
  } catch (err) {
    // Only swallow missing-table errors during first App Platform build.
    if (!isMissingTableError(err)) throw err;
    return (
      <HomePage
        categories={[]}
        popularNow={[]}
        readyToEat={[]}
        promotions={[]}
        testimonials={[]}
        customerReviews={[]}
        isOpen={true}
        whatsappUrl={resolveWhatsAppUrl("")}
      />
    );
  }
}
