import { FarmerPortalChrome } from "../FarmerPortalChrome";
import { FarmerRegisterForm } from "../FarmerRegisterForm";

export const dynamic = "force-dynamic";

/**
 * Unlisted partner registration — not linked from the customer storefront.
 * Organic vs standard (non-organic) paths live on the same portal.
 */
export default function FarmerRegisterPage() {
  return (
    <FarmerPortalChrome mode="register">
      <FarmerRegisterForm />
    </FarmerPortalChrome>
  );
}
