import { Suspense } from "react";
import { FarmerPortalChrome } from "../FarmerPortalChrome";
import { FarmerLoginForm } from "./FarmerLoginForm";

export const dynamic = "force-dynamic";

export default function FarmerLoginPage() {
  return (
    <FarmerPortalChrome mode="register">
      <Suspense fallback={<p className="mt-8 text-center text-sm">Loading…</p>}>
        <FarmerLoginForm />
      </Suspense>
    </FarmerPortalChrome>
  );
}
