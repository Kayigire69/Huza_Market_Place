import { NextResponse } from "next/server";
import { getSettings } from "@/services/settings.service";

export async function GET() {
  const settings = await getSettings([
    "whatsapp_url",
    "phone",
    "email",
    "company_name",
    "brand_name",
  ]);
  return NextResponse.json({
    whatsapp_url: settings.whatsapp_url || "https://wa.me/250788000000",
    phone: settings.phone || "",
    email: settings.email || "",
    company_name: settings.company_name || "Youth Huza",
    brand_name: settings.brand_name || "HUZA FRESH",
  });
}
