import { Suspense } from "react";
import { listDeliveryZones } from "@/services/settings.service";
import CheckoutPage from "./CheckoutClient";

export default async function Page() {
  const rows = await listDeliveryZones();
  const zones = rows.map((z) => ({
    id: z.id,
    code: z.code,
    labelEn: z.labelEn,
    feeRwf: z.feeRwf,
    etaMinutes: z.etaMinutes,
    etaLabelEn: z.etaLabelEn || `${z.etaMinutes} minutes`,
  }));
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading checkout...</div>}>
      <CheckoutPage zones={zones} />
    </Suspense>
  );
}
