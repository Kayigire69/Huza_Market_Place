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
  description: z.string().optional(),
});

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
                  phone: data.phone,
                  description: data.description || null,
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
