/**
 * Generates unique storefront SVGs for every catalog product + category
 * so no two items share the same image asset.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Load TS catalog via dynamic path — read as text and extract slugs/names
const catalogPath = path.join(root, "prisma", "catalog-data.ts");
const raw = fs.readFileSync(catalogPath, "utf8");

function hashHue(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 360;
}

function svgFor({ slug, label, kind }) {
  const hue = hashHue(slug);
  const hue2 = (hue + 38) % 360;
  const bg1 = `hsl(${hue} 42% 32%)`;
  const bg2 = `hsl(${hue2} 48% 22%)`;
  const accent = `hsl(${(hue + 80) % 360} 55% 58%)`;
  const initial = label.replace(/[^A-Za-z]/g, " ").trim().slice(0, 1).toUpperCase() || "H";
  const short = label.length > 22 ? label.slice(0, 20) + "…" : label;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800" role="img" aria-label="${label.replace(/"/g, "'")}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="r" cx="70%" cy="20%" r="55%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="800" fill="url(#g)"/>
  <rect width="800" height="800" fill="url(#r)"/>
  <circle cx="220" cy="560" r="160" fill="hsl(${hue} 35% 18%)" opacity="0.35"/>
  <circle cx="620" cy="240" r="110" fill="${accent}" opacity="0.25"/>
  <circle cx="400" cy="360" r="120" fill="rgba(255,255,255,0.12)"/>
  <text x="400" y="390" text-anchor="middle" font-family="Georgia, serif" font-size="140" font-weight="700" fill="rgba(255,255,255,0.92)">${initial}</text>
  <text x="400" y="680" text-anchor="middle" font-family="system-ui,sans-serif" font-size="36" font-weight="600" fill="rgba(255,255,255,0.95)">${short.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
  <text x="400" y="730" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" letter-spacing="3" fill="${accent}">HUZA FRESH · ${kind.toUpperCase()}</text>
</svg>
`;
}

const outDir = path.join(root, "public", "images", "catalog");
fs.mkdirSync(outDir, { recursive: true });

const categoryBlocks = [...raw.matchAll(/\{\s*slug:\s*"([^"]+)"[\s\S]*?nameEn:\s*"([^"]+)"[\s\S]*?image:\s*"([^"]+)"/g)];
// First 6 are categories in CATALOG_CATEGORIES — but regex will also hit products.
// Better parse categories and products separately.

const catSection = raw.slice(raw.indexOf("CATALOG_CATEGORIES"), raw.indexOf("CATALOG_PRODUCTS"));
const prodSection = raw.slice(raw.indexOf("CATALOG_PRODUCTS"));

const cats = [...catSection.matchAll(/slug:\s*"([^"]+)"[\s\S]*?nameEn:\s*"([^"]+)"/g)];
const prods = [...prodSection.matchAll(/slug:\s*"([^"]+)"[\s\S]*?nameEn:\s*"([^"]+)"/g)];

const mapEntries = [];

for (const [, slug, nameEn] of cats) {
  const file = `cat-${slug}.svg`;
  fs.writeFileSync(path.join(outDir, file), svgFor({ slug, label: nameEn, kind: "category" }));
  mapEntries.push({ type: "category", slug, nameEn, path: `/images/catalog/${file}` });
  console.log("cat", file);
}

for (const [, slug, nameEn] of prods) {
  const file = `${slug}.svg`;
  fs.writeFileSync(path.join(outDir, file), svgFor({ slug, label: nameEn, kind: "product" }));
  mapEntries.push({ type: "product", slug, nameEn, path: `/images/catalog/${file}` });
  console.log("product", file);
}

// Hero atmosphere panels (no broken JPG URLs)
const heroDir = path.join(root, "public", "images", "hero");
fs.mkdirSync(heroDir, { recursive: true });
const heroes = [
  ["hero-farm", "From verified farms", 118],
  ["hero-fresh", "Fresh every day", 145],
  ["hero-delivery", "Delivered to your door", 200],
];
for (const [id, caption, hue] of heroes) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900">
  <defs>
    <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 40% 18%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 40) % 360} 45% 10%)"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#hg)"/>
  <circle cx="1280" cy="180" r="280" fill="hsl(${(hue + 70) % 360} 50% 45%)" opacity="0.22"/>
  <circle cx="260" cy="720" r="320" fill="hsl(${hue} 35% 28%)" opacity="0.35"/>
  <text x="80" y="820" font-family="Georgia,serif" font-size="48" fill="rgba(255,255,255,0.55)">${caption}</text>
</svg>`;
  fs.writeFileSync(path.join(heroDir, `${id}.svg`), svg);
}

const mapTs = `/** Auto-generated unique storefront image paths — do not hand-edit; regenerate via scripts/generate-catalog-images.mjs */
export const PRODUCT_IMAGE_BY_NAME_EN: Record<string, string> = {
${mapEntries
  .filter((e) => e.type === "product")
  .map((e) => `  ${JSON.stringify(e.nameEn)}: ${JSON.stringify(e.path)},`)
  .join("\n")}
};

export const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
${mapEntries
  .filter((e) => e.type === "category")
  .map((e) => `  ${JSON.stringify(e.slug)}: ${JSON.stringify(e.path)},`)
  .join("\n")}
};

export function resolveProductImage(
  nameEn: string,
  images?: { url: string; isCover?: boolean }[]
): string {
  return (
    PRODUCT_IMAGE_BY_NAME_EN[nameEn] ??
    images?.find((i) => i.isCover)?.url ??
    images?.[0]?.url ??
    "/logo.svg"
  );
}

export function resolveCategoryImage(slug: string, imageUrl?: string | null): string {
  return CATEGORY_IMAGE_BY_SLUG[slug] ?? imageUrl ?? "/logo.svg";
}
`;

fs.writeFileSync(path.join(root, "src", "lib", "catalog-images.ts"), mapTs);

// Rewrite image: lines in catalog-data.ts to unique SVG paths
let updated = raw;
for (const e of mapEntries.filter((x) => x.type === "product")) {
  // Replace image near each slug block — safer: replace all old shared paths by rewriting whole file image fields via per-product
}
// Per-product: find slug block and set image
for (const e of mapEntries.filter((x) => x.type === "product")) {
  const re = new RegExp(
    `(slug:\\s*"${e.slug}"[\\s\\S]*?image:\\s*")[^"]+(")`,
    "m"
  );
  updated = updated.replace(re, `$1${e.path}$2`);
}
for (const e of mapEntries.filter((x) => x.type === "category")) {
  const re = new RegExp(
    `(slug:\\s*"${e.slug}"[\\s\\S]*?image:\\s*")[^"]+(")`,
    "m"
  );
  updated = updated.replace(re, `$1${e.path}$2`);
}
fs.writeFileSync(catalogPath, updated);

console.log(`Wrote ${mapEntries.length} catalog SVGs + catalog-images.ts`);
