import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  estimateHarvestDate,
  HARVEST_ALERT_LEAD_DAYS,
  daysRemaining,
} from "@/lib/harvest-estimate";

async function requireSupplier() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const farmer = await prisma.supplier.findUnique({
    where: { userId: session.user.id },
  });
  if (!farmer) {
    return { error: NextResponse.json({ error: "Farmer profile required" }, { status: 403 }) };
  }
  return { session, farmer };
}

const cropSchema = z.object({
  nameEn: z.string().min(2),
  plantingDate: z.string().optional().nullable(),
  expectedHarvestDate: z.string().optional().nullable(),
  expectedQty: z.coerce.number().int().positive().optional().nullable(),
  actualQty: z.coerce.number().int().nonnegative().optional().nullable(),
  unit: z.string().optional(),
  growthStage: z.string().optional().nullable(),
  farmStatus: z.string().optional().nullable(),
  fertilizerUsed: z.string().optional().nullable(),
  pesticidesUsed: z.string().optional().nullable(),
  diseases: z.string().optional().nullable(),
  pests: z.string().optional().nullable(),
  irrigation: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  const auth = await requireSupplier();
  if ("error" in auth) return auth.error;

  const crops = await prisma.farmCrop.findMany({
    where: { supplierId: auth.farmer.id },
    orderBy: [{ expectedHarvestDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({
    crops: crops.map((c) => {
      const days = daysRemaining(c.expectedHarvestDate);
      return { ...c, daysRemaining: days };
    }),
  });
}

export async function POST(req: Request) {
  const auth = await requireSupplier();
  if ("error" in auth) return auth.error;

  try {
    const body = cropSchema.parse(await req.json());
    const planting = body.plantingDate ? new Date(body.plantingDate) : null;
    let expected = body.expectedHarvestDate ? new Date(body.expectedHarvestDate) : null;
    if (!expected && planting) {
      expected = estimateHarvestDate(planting, body.nameEn);
    }

    const crop = await prisma.farmCrop.create({
      data: {
        supplierId: auth.farmer.id,
        nameEn: body.nameEn,
        plantingDate: planting,
        expectedHarvestDate: expected,
        expectedQty: body.expectedQty ?? null,
        actualQty: body.actualQty ?? null,
        unit: body.unit || "KG",
        growthStage: body.growthStage || "vegetative",
        farmStatus: body.farmStatus || null,
        fertilizerUsed: body.fertilizerUsed || null,
        pesticidesUsed: body.pesticidesUsed || null,
        diseases: body.diseases || null,
        pests: body.pests || null,
        irrigation: body.irrigation || null,
        notes: body.notes || null,
      },
    });

    // Notify admins when harvest is within the lead window
    if (expected) {
      const days = daysRemaining(expected);
      if (days !== null && days <= HARVEST_ALERT_LEAD_DAYS) {
        const admins = await prisma.user.findMany({
          where: {
            role: { in: ["SUPER_ADMIN", "ADMIN", "MANAGER", "PROCUREMENT"] },
          },
          select: { id: true },
          take: 20,
        });
        if (admins.length) {
          await prisma.notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              type: "HARVEST_ALERT",
              title: `Harvest soon: ${crop.nameEn}`,
              body: `${auth.farmer.businessName} expects harvest of ${crop.nameEn} in ~${days} day(s). Prepare procurement.`,
            })),
          });
          await prisma.farmCrop.update({
            where: { id: crop.id },
            data: { harvestAlertSentAt: new Date() },
          });
        }
      }
    }

    return NextResponse.json({ crop }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message || "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save crop" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireSupplier();
  if ("error" in auth) return auth.error;

  try {
    const raw = await req.json();
    const id = String(raw.id || "");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const existing = await prisma.farmCrop.findFirst({
      where: { id, supplierId: auth.farmer.id },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = cropSchema.partial().extend({ nameEn: z.string().min(2).optional() }).parse(raw);
    const planting = body.plantingDate ? new Date(body.plantingDate) : existing.plantingDate;
    let expected = body.expectedHarvestDate
      ? new Date(body.expectedHarvestDate)
      : existing.expectedHarvestDate;
    if (body.plantingDate && !body.expectedHarvestDate && planting) {
      expected = estimateHarvestDate(planting, body.nameEn || existing.nameEn);
    }

    const crop = await prisma.farmCrop.update({
      where: { id },
      data: {
        nameEn: body.nameEn ?? existing.nameEn,
        plantingDate: planting,
        expectedHarvestDate: expected,
        expectedQty: body.expectedQty === undefined ? existing.expectedQty : body.expectedQty,
        actualQty: body.actualQty === undefined ? existing.actualQty : body.actualQty,
        unit: body.unit ?? existing.unit,
        growthStage: body.growthStage === undefined ? existing.growthStage : body.growthStage,
        farmStatus: body.farmStatus === undefined ? existing.farmStatus : body.farmStatus,
        fertilizerUsed:
          body.fertilizerUsed === undefined ? existing.fertilizerUsed : body.fertilizerUsed,
        pesticidesUsed:
          body.pesticidesUsed === undefined ? existing.pesticidesUsed : body.pesticidesUsed,
        diseases: body.diseases === undefined ? existing.diseases : body.diseases,
        pests: body.pests === undefined ? existing.pests : body.pests,
        irrigation: body.irrigation === undefined ? existing.irrigation : body.irrigation,
        notes: body.notes === undefined ? existing.notes : body.notes,
      },
    });

    return NextResponse.json({ crop });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues[0]?.message || "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update crop" }, { status: 500 });
  }
}
