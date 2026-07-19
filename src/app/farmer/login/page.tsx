import { Suspense } from "react";
import { FarmerLoginForm } from "./FarmerLoginForm";

export const dynamic = "force-dynamic";

/** Standalone one-page farmer login — no multi-step chrome. */
export default function FarmerLoginPage() {
  return (
    <Suspense fallback={<p className="mx-auto mt-16 max-w-md px-4 text-center text-sm">Loading…</p>}>
      <FarmerLoginForm />
    </Suspense>
  );
}
