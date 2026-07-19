import { Suspense } from "react";
import { FarmerRegisterForm } from "../FarmerRegisterForm";

export const dynamic = "force-dynamic";

/** Full-viewport registration — no outer chrome that forces scroll. */
export default function FarmerRegisterPage() {
  return (
    <div className="h-full">
      <Suspense fallback={<p className="p-6 text-center text-sm">Loading…</p>}>
        <FarmerRegisterForm />
      </Suspense>
    </div>
  );
}
