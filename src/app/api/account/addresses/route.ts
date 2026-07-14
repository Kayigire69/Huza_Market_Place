import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { label, fullAddress, district, gpsLat, gpsLng, isDefault } = await req.json();
  if (!fullAddress) return NextResponse.json({ error: "Address required" }, { status: 400 });

  const lat =
    gpsLat !== undefined && gpsLat !== null && gpsLat !== "" ? Number(gpsLat) : null;
  const lng =
    gpsLng !== undefined && gpsLng !== null && gpsLng !== "" ? Number(gpsLng) : null;

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: session.user.id },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      userId: session.user.id,
      label: label || "Home",
      fullAddress,
      district: district || null,
      gpsLat: lat !== null && Number.isFinite(lat) ? lat : null,
      gpsLng: lng !== null && Number.isFinite(lng) ? lng : null,
      isDefault: Boolean(isDefault),
    },
  });

  return NextResponse.json({ ok: true, address });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.address.update({
    where: { id },
    data: {
      ...(body.label !== undefined ? { label: String(body.label) } : {}),
      ...(body.fullAddress !== undefined ? { fullAddress: String(body.fullAddress) } : {}),
      ...(body.district !== undefined ? { district: body.district ? String(body.district) : null } : {}),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.address.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.address.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
