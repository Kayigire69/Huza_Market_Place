import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadFiles, storageMode, type UploadFolder } from "@/services/upload.service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "SUPPLIER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const form = await req.formData();
    const folder = String(form.get("folder") || "products") as UploadFolder;
    const safeFolder: UploadFolder = ["products", "profiles", "documents"].includes(folder)
      ? folder
      : "products";
    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    const urls = await uploadFiles(files, safeFolder);
    return NextResponse.json({ urls, storage: storageMode() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
