import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPPLIER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
  }
  if (files.length > 8) {
    return NextResponse.json({ error: "Maximum 8 photos per upload" }, { status: 400 });
  }

  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || file.name}` },
        { status: 400 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `${file.name} is larger than 5MB` }, { status: 400 });
    }
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : "jpg";
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buffer);
    urls.push(`/uploads/products/${name}`);
  }

  return NextResponse.json({ urls });
}
