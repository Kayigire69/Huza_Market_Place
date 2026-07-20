import { Suspense } from "react";
import { FarmerLoginForm } from "./FarmerLoginForm";

export const dynamic = "force-dynamic";

/** Full-viewport login. No page scroll. */
export default function FarmerLoginPage() {
  return (
    <div className="h-full">
      <Suspense fallback={<p className="p-6 text-center text-sm">Loading…</p>}>
        <FarmerLoginForm />
      </Suspense>
    </div>
  );
}
