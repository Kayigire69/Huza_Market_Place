import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  listDeliveryZones,
  getDeliveryFee,
  getHuzaPayee,
  getPickupInfo,
  getSetting,
} from "@/services/settings.service";
import { ZONE_ETA_LABELS, ZONE_ETA_MINUTES } from "@/lib/delivery-eta";
import { hasAirtelCredentials, hasMtnCredentials } from "@/lib/payments/mobile-money";
import { whatsappPresetUrl } from "@/lib/brand-contact";
import CheckoutPage from "./CheckoutClient";

export default async function Page() {
  const session = await getServerSession(authOptions);
  const [rows, deliveryFee, payee, pickup, whatsappSetting] = await Promise.all([
    listDeliveryZones(),
    getDeliveryFee("KIGALI"),
    getHuzaPayee(),
    getPickupInfo(),
    getSetting("whatsapp_url", ""),
  ]);
  const zones = rows.map((z) => {
    const code = z.code as keyof typeof ZONE_ETA_LABELS;
    return {
      id: z.id,
      code: z.code,
      labelEn: z.labelEn,
      feeRwf: Number.isFinite(z.feeRwf) ? z.feeRwf : deliveryFee,
      etaMinutes: ZONE_ETA_MINUTES[code] ?? z.etaMinutes,
      etaLabelEn: ZONE_ETA_LABELS[code] ?? z.etaLabelEn ?? `${z.etaMinutes} minutes`,
    };
  });

  let customer: { fullName: string; phone: string } | null = null;
  let savedAddresses: {
    id: string;
    label: string;
    fullAddress: string;
    district: string | null;
    gpsLat: number | null;
    gpsLng: number | null;
  }[] = [];

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        fullName: true,
        phone: true,
        addresses: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
          take: 8,
          select: {
            id: true,
            label: true,
            fullAddress: true,
            district: true,
            gpsLat: true,
            gpsLng: true,
          },
        },
      },
    });
    if (user) {
      customer = { fullName: user.fullName, phone: user.phone };
      savedAddresses = user.addresses;
    }
  }

  const paymentConfig = {
    payeeName: payee.name,
    payeePhone: payee.phone,
    whatsappUrl: whatsappPresetUrl("orderSupport", whatsappSetting || pickup.whatsappUrl),
    mtnLive: hasMtnCredentials(),
    airtelLive: hasAirtelCredentials(),
  };

  return (
    <Suspense fallback={<div className="p-10 text-center">Loading checkout...</div>}>
      <CheckoutPage
        zones={zones}
        customer={customer}
        savedAddresses={savedAddresses}
        paymentConfig={paymentConfig}
        pickupInfo={pickup}
      />
    </Suspense>
  );
}
