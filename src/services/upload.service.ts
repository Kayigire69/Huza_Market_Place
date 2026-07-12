import { v2 as cloudinary } from "cloudinary";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

export type UploadFolder = "products" | "storefront" | "profiles" | "documents";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1600;

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function ensureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function extFor(type: string) {
  if (type === "application/pdf") return "pdf";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

async function compressImage(file: File): Promise<{ buffer: Buffer; mime: string; ext: string }> {
  const input = Buffer.from(await file.arrayBuffer());
  if (file.type === "application/pdf" || file.type === "image/gif") {
    return { buffer: input, mime: file.type, ext: extFor(file.type) };
  }

  try {
    const pipeline = sharp(input, { failOn: "none" })
      .rotate()
      .resize({
        width: MAX_IMAGE_EDGE,
        height: MAX_IMAGE_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      });

    // Prefer webp for local storefront assets — smaller payloads for next/image.
    const buffer = await pipeline.webp({ quality: 78 }).toBuffer();
    return { buffer, mime: "image/webp", ext: "webp" };
  } catch {
    return { buffer: input, mime: file.type, ext: extFor(file.type) };
  }
}

async function uploadLocal(file: File, folder: UploadFolder): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const compressed = await compressImage(file);
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${compressed.ext}`;
  await writeFile(path.join(dir, name), compressed.buffer);
  return `/uploads/${folder}/${name}`;
}

async function uploadCloudinary(file: File, folder: UploadFolder): Promise<string> {
  ensureCloudinary();
  const compressed = await compressImage(file);
  const resourceType = file.type === "application/pdf" ? "raw" : "image";
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `huza-fresh/${folder}`,
        resource_type: resourceType,
        transformation:
          resourceType === "image"
            ? [{ quality: "auto", fetch_format: "auto" }]
            : undefined,
      },
      (err, res) => {
        if (err || !res) reject(err || new Error("Cloudinary upload failed"));
        else resolve(res as { secure_url: string });
      }
    );
    stream.end(compressed.buffer);
  });
  return result.secure_url;
}

export async function uploadFiles(files: File[], folder: UploadFolder): Promise<string[]> {
  if (files.length === 0) throw new Error("No files uploaded");
  if (files.length > 8) throw new Error("Maximum 8 files per upload");

  const urls: string[] = [];
  const useCloud = cloudinaryConfigured();

  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      throw new Error(`Unsupported file type: ${file.type || file.name}`);
    }
    if (file.size > MAX_BYTES) {
      throw new Error(`${file.name} is larger than 8MB`);
    }
    urls.push(useCloud ? await uploadCloudinary(file, folder) : await uploadLocal(file, folder));
  }

  return urls;
}

export function storageMode(): "cloudinary" | "local" {
  return cloudinaryConfigured() ? "cloudinary" : "local";
}
