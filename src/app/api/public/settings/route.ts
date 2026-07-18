import { NextResponse } from "next/server";
import { getSettings } from "@/services/settings.service";
import { SUPPORT_EMAIL, resolveWhatsAppUrl } from "@/lib/brand-contact";

export async function GET() {
  const settings = await getSettings([
    "whatsapp_url",
    "phone",
    "email",
    "company_name",
    "brand_name",
    "company_tagline",
    "company_address",
    "delivery_fee_rwf",
    "payment_mtn_enabled",
    "payment_airtel_enabled",
  ]);
  return NextResponse.json({
    whatsapp_url: resolveWhatsAppUrl(settings.whatsapp_url),
    phone: settings.phone || "",
    email: settings.email || SUPPORT_EMAIL,
    company_name: settings.company_name || "Youth Huza",
    brand_name: settings.brand_name || "HUZA FRESH",
    company_tagline: settings.company_tagline || "",
    company_address: settings.company_address || "",
    delivery_fee_rwf: Number(settings.delivery_fee_rwf) || 5000,
    payment_mtn_enabled: settings.payment_mtn_enabled !== "false",
    payment_airtel_enabled: settings.payment_airtel_enabled !== "false",
  });
}
