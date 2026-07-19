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
});

function toUrlList(value?: string | string[]) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return value
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
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

    const data = schema.parse(await req.json());
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
      const farmingType = data.farmingType || "ORGANIC";
      if (farmingType === "STANDARD") {
        if (!data.productsOffered || data.productsOffered.trim().length < 3) {
          return NextResponse.json({ error: "List the products you offer to Huza" }, { status: 400 });
        }
        if (!data.huzaPurchaseAgreement || data.huzaPurchaseAgreement.trim().length < 10) {
          return NextResponse.json(
            { error: "Describe the purchase agreement with Huza" },
            { status: 400 }
          );
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
              businessName: data.businessName || `${data.fullName}'s Farm`,
              location: data.location || "Rwanda",
              district: data.district || "Kigali",
              sector: data.sector || null,
              phone,
              email: null,
              description: data.description || null,
              nationalId: nid,
              companyRegNo: data.companyRegNo || null,
              tin: data.tin || null,
              farmSize: data.farmSize || null,
              productionCapacity: data.productionCapacity || null,
              productCategories: data.productCategories || data.productsOffered || null,
              productsOffered: data.productsOffered || null,
              huzaPurchaseAgreement: data.huzaPurchaseAgreement || null,
              farmingType,
              agreedToHuzaTerms: true,
              agreedToHuzaTermsAt: new Date(),
              paymentMomo: data.paymentMomo || null,
              bankAccount: data.bankAccount || null,
              bankName: data.bankName || null,
              nationalIdUrl: data.nationalIdUrl || null,
              businessCertUrl: data.businessCertUrl || null,
              tinDocUrl: data.tinDocUrl || null,
              foodSafetyUrl: data.foodSafetyUrl || null,
              organicCertUrl: data.organicCertUrl || null,
              permitUrl: data.permitUrl || null,
              documentsUrl: data.documentsUrl || null,
              farmPhotoUrls: toUrlList(data.farmPhotoUrls),
              productPhotoUrls: toUrlList(data.productPhotoUrls),
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
