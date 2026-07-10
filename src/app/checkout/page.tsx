import { Suspense } from "react";
import CheckoutPage from "./CheckoutClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading checkout...</div>}>
      <CheckoutPage />
    </Suspense>
  );
}
