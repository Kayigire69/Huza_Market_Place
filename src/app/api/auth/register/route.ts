import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { isValidRwandaMomoPhone } from "@/lib/phone";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  digitsOnly,
  normalizeRwandaPhone,
  unusedFarmerPasswordHash,
} from "@/lib/farmer-auth";
import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "@/lib/security-access";
import { pickFarmerDossier } from "@/lib/farmer-dossier";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  /** Required for customers; ignored for farmers (NID auth). */
  password: z.string().min(8).optional().or(z.literal("")),
  role: z.enum(["CUSTOMER", "SUPPLIER"]).default("CUSTOMER"),
  farmingType: z.enum(["ORGANIC", "STANDARD", "CONVERSION"]).optional(),
  businessName: z.string().optional(),
  location: z.string().optional(),
  district: z.string().optional(),
  sector: z.string().optional(),
  description: z.string().optional(),
  nationalId: z.string().optional(),
  companyRegNo: z.string().optional(),
  tin: z.string().optional(),
  farmSize: z.string().optional(),
  productionCapacity: z.string().optional(),
  productCategories: z.string().optional(),
  productsOffered: z.string().optional(),
  huzaPurchaseAgreement: z.string().optional(),
  agreedToHuzaTerms: z.boolean().optional(),
  paymentMomo: z.string().optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  nationalIdUrl: z.string().optional(),
  businessCertUrl: z.string().optional(),
  tinDocUrl: z.string().optional(),
  foodSafetyUrl: z.string().optional(),
  organicCertUrl: z.string().optional(),
  permitUrl: z.string().optional(),
  documentsUrl: z.string().optional(),
  farmPhotoUrls: z.union([z.string(), z.array(z.string())]).optional(),
  productPhotoUrls: z.union([z.string(), z.array(z.string())]).optional(),
  currentCrop: z.string().optional(),
  gender: z.string().optional(),
  province: z.string().optional(),
  cell: z.string().optional(),
  village: z.string().optional(),
  ageRange: z.string().optional(),
  fieldType: z.string().optional(),
  qualityGeneral: z.string().optional(),
  totalQuantityHarvested: z.string().optional(),
  paymentOption: z.string().optional(),
  pricePerUnit: z.union([z.number(), z.string()]).optional().nullable(),
});

function toUrlList(value?: string | string[]) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function asInt(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function asFloat(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function POST(req: Request) {
  try {
    const rl = await rateLimit({
      key: `register:${clientIp(req)}`,
      limit: 8,
      windowMs: 15 * 60_000,
    });
    if (!rl.ok) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const raw = (await req.json()) as Record<string, unknown>;
    const data = schema.parse(raw);
    const phone = normalizeRwandaPhone(data.phone);
    if (!isValidRwandaMomoPhone(phone)) {
      return NextResponse.json(
        { error: "Enter a valid MTN (078/079) or Airtel (072/073) phone number" },
        { status: 400 }
      );
    }

    if (data.role === "SUPPLIER") {
      if (!data.agreedToHuzaTerms) {
        return NextResponse.json(
          { error: "You must agree to how Huza will buy from you" },
          { status: 400 }
        );
      }
      const nid = digitsOnly(data.nationalId || "");
      if (nid.length < 5) {
        return NextResponse.json(
          { error: "Enter your full National ID number" },
          { status: 400 }
        );
      }

      // Startup phase: all new farmers are Conventional (STANDARD).
      // Slim signup: identity + contact + location + main crop(s) + terms.
      // Optional farm dossier → Settings while PENDING; MoMo/sales → after APPROVED.
      const farmingType = "STANDARD" as const;
      const dossier = pickFarmerDossier(raw);

      const productsOffered =
        (data.productsOffered || "").trim() ||
        String(dossier.currentCrop || data.currentCrop || "").trim();
      const huzaPurchaseAgreement = (data.huzaPurchaseAgreement || "").trim() || "";

      if (productsOffered.length < 3) {
        return NextResponse.json(
          { error: "Enter your main crop(s) or products" },
          { status: 400 }
        );
      }

      const requiredLocation: Array<[string, string]> = [
        ["province", "Province"],
        ["district", "District"],
        ["sector", "Sector"],
        ["cell", "Cell"],
        ["village", "Village"],
      ];
      for (const [key, label] of requiredLocation) {
        const v = dossier[key] ?? (data as Record<string, unknown>)[key];
        if (!v || String(v).trim() === "") {
          return NextResponse.json({ error: `${label} is required` }, { status: 400 });
        }
      }

      const phoneTaken = await prisma.user.findFirst({ where: { phone } });
      if (phoneTaken) {
        return NextResponse.json(
          { error: "This phone number is already registered" },
          { status: 400 }
        );
      }
      const nidTaken = await prisma.supplier.findFirst({
        where: { nationalId: nid },
      });
      if (nidTaken) {
        return NextResponse.json(
          { error: "This National ID is already registered" },
          { status: 400 }
        );
      }

      const location =
        String(dossier.location || data.location || "").trim() ||
        [dossier.village, dossier.cell, dossier.sector, dossier.district, dossier.province]
          .map((x) => (x ? String(x).trim() : ""))
          .filter(Boolean)
          .join(", ") ||
        "Rwanda";

      const passwordHash = await unusedFarmerPasswordHash();
      const user = await prisma.user.create({
        data: {
          fullName: data.fullName,
          phone,
          email: null,
          passwordHash,
          role: Role.SUPPLIER,
          mustChangePassword: false,
          supplier: {
            create: {
              businessName:
                String(dossier.businessName || data.businessName || "").trim() ||
                `${data.fullName}'s Farm`,
              location,
              district: String(dossier.district || data.district || "Kigali"),
              sector: (dossier.sector as string) || data.sector || null,
              phone,
              email: null,
              description:
                (dossier.description as string) ||
                (dossier.farmerComments as string) ||
                data.description ||
                null,
              nationalId: nid,
              companyRegNo: data.companyRegNo || null,
              tin: data.tin || null,
              farmSize: (dossier.farmSize as string) || data.farmSize || null,
              productionCapacity: data.productionCapacity || null,
              productCategories: productsOffered,
              productsOffered,
              huzaPurchaseAgreement,
              farmingType,
              agreedToHuzaTerms: true,
              agreedToHuzaTermsAt: new Date(),
              paymentMomo: (dossier.paymentMomo as string | null) ?? data.paymentMomo ?? null,
              bankAccount: (dossier.bankAccount as string | null) ?? data.bankAccount ?? null,
              bankName: (dossier.bankName as string | null) ?? data.bankName ?? null,
              nationalIdUrl: data.nationalIdUrl || null,
              businessCertUrl: data.businessCertUrl || null,
              tinDocUrl: data.tinDocUrl || null,
              foodSafetyUrl: data.foodSafetyUrl || null,
              organicCertUrl: data.organicCertUrl || null,
              permitUrl: data.permitUrl || null,
              documentsUrl: data.documentsUrl || null,
              farmPhotoUrls: toUrlList(data.farmPhotoUrls),
              productPhotoUrls: toUrlList(data.productPhotoUrls),
              profilePhotoUrl: (dossier.profilePhotoUrl as string) || null,
              gender: (dossier.gender as string) || null,
              province: (dossier.province as string) || null,
              cell: (dossier.cell as string) || null,
              village: (dossier.village as string) || null,
              ageRange: (dossier.ageRange as string) || null,
              fieldType: (dossier.fieldType as string) || null,
              pastCropsSeason1: (dossier.pastCropsSeason1 as string) || null,
              pastCropsSeason2: (dossier.pastCropsSeason2 as string) || null,
              pastCropsSeason3: (dossier.pastCropsSeason3 as string) || null,
              currentCrop: (dossier.currentCrop as string) || productsOffered,
              chemicalsPerWeek: (dossier.chemicalsPerWeek as string) || null,
              chemicalsWhy: (dossier.chemicalsWhy as string) || null,
              chemicalsDosage: (dossier.chemicalsDosage as string) || null,
              fertilizerPerWeek: (dossier.fertilizerPerWeek as string) || null,
              irrigationMethod: (dossier.irrigationMethod as string) || null,
              diseasesIdentified: (dossier.diseasesIdentified as string) || null,
              pestsIdentified: (dossier.pestsIdentified as string) || null,
              totalQuantityHarvested: (dossier.totalQuantityHarvested as string) || null,
              qualityGeneral: (dossier.qualityGeneral as string) || null,
              priceUnit: (dossier.priceUnit as string) || "kg",
              pricePerUnit: asInt(dossier.pricePerUnit),
              totalKgsBoughtByHuza: asFloat(dossier.totalKgsBoughtByHuza) ?? 0,
              paymentOption: (dossier.paymentOption as string) || null,
              farmGatePrice: asInt(dossier.farmGatePrice),
              priceUponDelivery: asInt(dossier.priceUponDelivery),
              priceAfterSale: asInt(dossier.priceAfterSale),
              proofOfPaymentUrl: (dossier.proofOfPaymentUrl as string) || null,
              farmerComments: (dossier.farmerComments as string) || null,
              status: "PENDING",
            },
          },
        },
      });

      return NextResponse.json({
        id: user.id,
        farmingType,
        phone,
        nationalIdLast4: nid.slice(-4),
      });
    }

    // Customer registration (unchanged password flow)
    if (!data.password || data.password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ phone }, ...(data.email ? [{ email: data.email }] : [])],
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Phone or email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        phone,
        email: data.email || null,
        passwordHash,
        role: Role.CUSTOMER,
      },
    });

    return NextResponse.json({ id: user.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 400 });
  }
}
