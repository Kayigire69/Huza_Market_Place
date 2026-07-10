import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6),
  role: z.enum(["CUSTOMER", "SUPPLIER"]).default("CUSTOMER"),
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
    const data = schema.parse(await req.json());
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: data.phone },
          ...(data.email ? [{ email: data.email }] : []),
        ],
      },
    });
    if (existing) {
      return NextResponse.json({ error: "Phone or email already registered" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        passwordHash,
        role: data.role as Role,
        ...(data.role === "SUPPLIER"
          ? {
              supplier: {
                create: {
                  businessName: data.businessName || `${data.fullName}'s Farm`,
                  location: data.location || "Rwanda",
                  district: data.district || "Kigali",
                  sector: data.sector || null,
                  phone: data.phone,
                  email: data.email || null,
                  description: data.description || null,
                  nationalId: data.nationalId || null,
                  companyRegNo: data.companyRegNo || null,
                  tin: data.tin || null,
                  farmSize: data.farmSize || null,
                  productionCapacity: data.productionCapacity || null,
                  productCategories: data.productCategories || null,
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
            }
          : {}),
      },
    });

    return NextResponse.json({ id: user.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Registration failed" }, { status: 400 });
  }
}
