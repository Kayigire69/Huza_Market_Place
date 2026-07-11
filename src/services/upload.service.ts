import { v2 as cloudinary } from "cloudinary";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export type UploadFolder = "products" | "profiles" | "documents";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_BYTES = 8 * 1024 * 1024;

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

async function uploadLocal(file: File, folder: UploadFolder): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFor(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);
  return `/uploads/${folder}/${name}`;
}

async function uploadCloudinary(file: File, folder: UploadFolder): Promise<string> {
  ensureCloudinary();
  const buffer = Buffer.from(await file.arrayBuffer());
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
    stream.end(buffer);
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
