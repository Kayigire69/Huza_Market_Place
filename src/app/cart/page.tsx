import { listDeliveryZones } from "@/services/settings.service";
import { CartClient } from "./CartClient";

export default async function CartPage() {
  const rows = await listDeliveryZones();
  const zones = rows.map((z) => ({
    id: z.id,
    code: z.code,
    labelEn: z.labelEn,
    feeRwf: z.feeRwf,
    etaMinutes: z.etaMinutes,
    etaLabelEn: z.etaLabelEn || `${z.etaMinutes} minutes`,
  }));
  return <CartClient zones={zones} />;
}
