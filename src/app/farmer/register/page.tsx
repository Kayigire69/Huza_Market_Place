import { Suspense } from "react";
import { FarmerPortalChrome } from "../FarmerPortalChrome";
import { FarmerRegisterForm } from "../FarmerRegisterForm";

export const dynamic = "force-dynamic";

/**
 * Unlisted partner registration — not linked from the customer storefront.
 * Organic / conversion / conventional paths live on the same portal.
 */
export default function FarmerRegisterPage() {
  return (
    <FarmerPortalChrome mode="register">
      <Suspense fallback={<p className="mt-8 text-center text-sm">Loading registration…</p>}>
        <FarmerRegisterForm />
      </Suspense>
    </FarmerPortalChrome>
  );
}
