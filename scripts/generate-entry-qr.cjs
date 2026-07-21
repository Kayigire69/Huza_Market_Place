const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const sharp = require("sharp");

const ENTRY_URL = "https://www.youthhuza.rw/";
const ENTRY_LABEL = "www.youthhuza.rw";
const BRAND_GREEN = "#0B5C34";
const BRAND_MINT = "#E8F5EC";
const PREFIX = "youthhuza-entry-qr";
const outDir = path.join(__dirname, "..", "public", "qr");
const logoPath = path.join(__dirname, "..", "public", "images", "youth-huza-logo.png");

const baseOptions = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: {
    dark: BRAND_GREEN,
    light: "#FFFFFF",
  },
};

async function generateBaseQr(url, size) {
  return QRCode.toBuffer(url, {
    ...baseOptions,
    type: "png",
    width: size,
  });
}

async function generateBrandedQr(url, size, logoScale = 0.22) {
  const qrBuffer = await generateBaseQr(url, size);
  const logoSize = Math.round(size * logoScale);
  const badgeSize = Math.round(logoSize * 1.18);
  const badgeRadius = Math.round(badgeSize * 0.18);

  const badgeSvg = Buffer.from(
    `<svg width="${badgeSize}" height="${badgeSize}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${badgeSize}" height="${badgeSize}" rx="${badgeRadius}" fill="#FFFFFF"/>
    </svg>`
  );

  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

  const badge = await sharp(badgeSvg).png().toBuffer();
  const badgeWithLogo = await sharp(badge)
    .composite([
      {
        input: logo,
        left: Math.round((badgeSize - logoSize) / 2),
        top: Math.round((badgeSize - logoSize) / 2),
      },
    ])
    .png()
    .toBuffer();

  const left = Math.round((size - badgeSize) / 2);
  const top = Math.round((size - badgeSize) / 2);

  return sharp(qrBuffer)
    .composite([{ input: badgeWithLogo, left, top }])
    .png()
    .toBuffer();
}

async function generatePoster({ url, width, height, qrSize, filename, headline, subhead, urlLabel, footer }) {
  const qrBuffer = await generateBrandedQr(url, qrSize, 0.24);
  const logoWidth = Math.round(width * 0.42);
  const logo = await sharp(logoPath).resize(logoWidth, null, { fit: "inside" }).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();

  const headlineSize = Math.round(width * 0.055);
  const subSize = Math.round(width * 0.032);
  const urlSize = Math.round(width * 0.034);
  const pad = Math.round(width * 0.08);

  const headlineY = pad + (logoMeta.height || 0) + Math.round(height * 0.04);
  const qrTop = headlineY + headlineSize + Math.round(height * 0.06);
  const qrLeft = Math.round((width - qrSize) / 2);
  const urlY = qrTop + qrSize + Math.round(height * 0.05);

  const svg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${BRAND_MINT}"/>
    <rect x="0" y="0" width="100%" height="${Math.round(height * 0.012)}" fill="${BRAND_GREEN}"/>
    <text x="50%" y="${headlineY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${headlineSize}" font-weight="700" fill="${BRAND_GREEN}">${headline}</text>
    <text x="50%" y="${headlineY + subSize * 1.4}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${subSize}" fill="#2D4A38">${subhead}</text>
    <text x="50%" y="${urlY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${urlSize}" font-weight="700" fill="${BRAND_GREEN}">${urlLabel}</text>
    <text x="50%" y="${urlY + subSize * 1.35}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${subSize}" fill="#4A6354">${footer}</text>
  </svg>`);

  const base = await sharp(svg).png().toBuffer();

  return sharp(base)
    .composite([
      {
        input: logo,
        left: Math.round((width - (logoMeta.width || logoWidth)) / 2),
        top: pad,
      },
      {
        input: qrBuffer,
        left: qrLeft,
        top: qrTop,
      },
    ])
    .png()
    .toFile(path.join(outDir, filename));
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const plainPng = path.join(outDir, `${PREFIX}.png`);
  const plainSvg = path.join(outDir, `${PREFIX}.svg`);
  const brandedPng = path.join(outDir, `${PREFIX}-branded.png`);

  await QRCode.toFile(plainPng, ENTRY_URL, { ...baseOptions, type: "png", width: 1200 });
  await QRCode.toFile(plainSvg, ENTRY_URL, { ...baseOptions, type: "svg", width: 1200 });
  await sharp(await generateBrandedQr(ENTRY_URL, 1200, 0.22)).toFile(brandedPng);

  await generatePoster({
    url: ENTRY_URL,
    width: 1748,
    height: 2480,
    qrSize: 920,
    filename: `${PREFIX}-flyer-a5.png`,
    headline: "Scan to open Youth Huza",
    subhead: "Shop fresh produce or join as a farmer",
    urlLabel: ENTRY_LABEL,
    footer: "Youth Huza · HUZA FRESH",
  });

  await generatePoster({
    url: ENTRY_URL,
    width: 2480,
    height: 3508,
    qrSize: 1280,
    filename: `${PREFIX}-poster-a4.png`,
    headline: "Scan to open Youth Huza",
    subhead: "Shop fresh produce or join as a farmer",
    urlLabel: ENTRY_LABEL,
    footer: "Youth Huza · HUZA FRESH",
  });

  console.log("Entry page QR assets ready");
  console.log("URL:", ENTRY_URL);
  console.log(`  Plain PNG:   ${plainPng}`);
  console.log(`  Plain SVG:   ${plainSvg}`);
  console.log(`  Branded PNG: ${brandedPng}`);
  console.log(`  Flyer A5:    ${path.join(outDir, `${PREFIX}-flyer-a5.png`)}`);
  console.log(`  Poster A4:   ${path.join(outDir, `${PREFIX}-poster-a4.png`)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
