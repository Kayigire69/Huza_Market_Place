import { Suspense } from "react";
import { FarmerPortalChrome } from "../FarmerPortalChrome";
import { FarmerRegisterForm } from "../FarmerRegisterForm";

export const dynamic = "force-dynamic";

/** One-page farmer registration — farming type + all fields on a single form. */
export default function FarmerRegisterPage() {
  return (
    <FarmerPortalChrome mode="register">
      <Suspense fallback={<p className="mt-8 text-center text-sm">Loading registration…</p>}>
        <FarmerRegisterForm />
      </Suspense>
    </FarmerPortalChrome>
  );
}
