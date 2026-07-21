import {
  HUZA_PAYEE_NAME,
  HUZA_PAYEE_PHONE,
  HUZA_PAYEE_WHATSAPP_URL,
  formatHuzaPayeeDisplay,
} from "@/lib/payments/huza-payee";

/** Editable pickup / contact info for checkout (Admin → Settings). */
export type PickupInfo = {
  locationName: string;
  address: string;
  mapsUrl: string;
  hours: string;
  phone: string;
  phoneDisplay: string;
  whatsappUrl: string;
};

export const HOME_DELIVERY_FEE_NOTICE =
  "Delivery charges depend on your delivery location. Our team will contact you to confirm the delivery fee before dispatching your order. The delivery fee is paid upon receiving the products.";

export const DEFAULT_PICKUP_INFO: PickupInfo = {
  locationName: "Youth Huza Pickup",
  address: "Kigali, Rwanda",
  mapsUrl: "",
  hours: "Mon–Sat 8:00–18:00",
  phone: HUZA_PAYEE_PHONE,
  phoneDisplay: formatHuzaPayeeDisplay(HUZA_PAYEE_PHONE),
  whatsappUrl: HUZA_PAYEE_WHATSAPP_URL,
};
