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

/** Detect type from magic bytes. Do not trust browser Content-Type alone. */
async function detectMime(buffer: Buffer, claimed: string): Promise<string> {
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  // Fall back to sharp metadata for odd JPEGs
  try {
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    if (meta.format === "jpeg") return "image/jpeg";
    if (meta.format === "png") return "image/png";
    if (meta.format === "webp") return "image/webp";
    if (meta.format === "gif") return "image/gif";
  } catch {
    /* ignore */
  }

  if (claimed && ALLOWED.has(claimed)) {
    throw new Error("File content does not match the declared type");
  }
  throw new Error("Unsupported or unrecognized file type");
}

async function compressImage(file: File): Promise<{ buffer: Buffer; mime: string; ext: string }> {
  const input = Buffer.from(await file.arrayBuffer());
  const mime = await detectMime(input, file.type || "");
  if (!ALLOWED.has(mime)) {
    throw new Error(`Unsupported file type: ${mime}`);
  }

  if (mime === "application/pdf" || mime === "image/gif") {
    return { buffer: input, mime, ext: extFor(mime) };
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

    const buffer = await pipeline.webp({ quality: 78 }).toBuffer();
    return { buffer, mime: "image/webp", ext: "webp" };
  } catch {
    // Never write untrusted raw bytes as a spoofed image
    throw new Error("Could not process image. Upload a valid JPEG, PNG, or WebP.");
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
  const resourceType = compressed.mime === "application/pdf" ? "raw" : "image";
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

  if (process.env.NODE_ENV === "production" && !useCloud) {
    throw new Error(
      "Cloudinary is required in production. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      throw new Error(`${file.name} is larger than 8MB`);
    }
    // Type is verified from magic bytes inside compressImage / detectMime
    urls.push(useCloud ? await uploadCloudinary(file, folder) : await uploadLocal(file, folder));
  }

  return urls;
}

export function storageMode(): "cloudinary" | "local" {
  return cloudinaryConfigured() ? "cloudinary" : "local";
}
