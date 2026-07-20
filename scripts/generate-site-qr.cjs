const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const sharp = require("sharp");

const SITE_URL = "https://www.youthhuza.rw";
const SITE_LABEL = "www.youthhuza.rw";
const BRAND_GREEN = "#0B5C34";
const BRAND_MINT = "#E8F5EC";
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

async function generateBaseQr(size) {
  return QRCode.toBuffer(SITE_URL, {
    ...baseOptions,
    type: "png",
    width: size,
  });
}

/** QR with HUZA logo centered on a white badge */
async function generateBrandedQr(size, logoScale = 0.22) {
  const qrBuffer = await generateBaseQr(size);
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

/** Simple poster layout: logo, headline, branded QR, URL */
async function generatePoster({ width, height, qrSize, filename }) {
  const qrBuffer = await generateBrandedQr(qrSize, 0.24);
  const logoWidth = Math.round(width * 0.42);
  const logo = await sharp(logoPath).resize(logoWidth, null, { fit: "inside" }).png().toBuffer();
  const logoMeta = await sharp(logo).metadata();

  const headlineSize = Math.round(width * 0.055);
  const subSize = Math.round(width * 0.032);
  const urlSize = Math.round(width * 0.038);
  const pad = Math.round(width * 0.08);

  const headlineY = pad + (logoMeta.height || 0) + Math.round(height * 0.04);
  const qrTop = headlineY + headlineSize + Math.round(height * 0.06);
  const qrLeft = Math.round((width - qrSize) / 2);
  const urlY = qrTop + qrSize + Math.round(height * 0.05);

  const svg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${BRAND_MINT}"/>
    <rect x="0" y="0" width="100%" height="${Math.round(height * 0.012)}" fill="${BRAND_GREEN}"/>
    <text x="50%" y="${headlineY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${headlineSize}" font-weight="700" fill="${BRAND_GREEN}">Scan to shop fresh produce</text>
    <text x="50%" y="${headlineY + subSize * 1.4}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${subSize}" fill="#2D4A38">Order online from Youth Huza</text>
    <text x="50%" y="${urlY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${urlSize}" font-weight="700" fill="${BRAND_GREEN}">${SITE_LABEL}</text>
    <text x="50%" y="${urlY + subSize * 1.35}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${subSize}" fill="#4A6354">HUZA FRESH · Powered by Youth Huza</text>
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

  const plainPng = path.join(outDir, "youthhuza-site-qr.png");
  const plainSvg = path.join(outDir, "youthhuza-site-qr.svg");
  const brandedPng = path.join(outDir, "youthhuza-site-qr-branded.png");
  const flyerPng = path.join(outDir, "youthhuza-flyer-a5.png");
  const posterPng = path.join(outDir, "youthhuza-poster-a4.png");

  await QRCode.toFile(plainPng, SITE_URL, { ...baseOptions, type: "png", width: 1200 });
  await QRCode.toFile(plainSvg, SITE_URL, { ...baseOptions, type: "svg", width: 1200 });

  const branded = await generateBrandedQr(1200, 0.22);
  await sharp(branded).toFile(brandedPng);

  // A5 flyer @ 300 dpi (1748 x 2480)
  await generatePoster({
    width: 1748,
    height: 2480,
    qrSize: 920,
    filename: "youthhuza-flyer-a5.png",
  });

  // A4 poster @ 300 dpi (2480 x 3508)
  await generatePoster({
    width: 2480,
    height: 3508,
    qrSize: 1280,
    filename: "youthhuza-poster-a4.png",
  });

  console.log(`QR assets generated for ${SITE_URL}`);
  console.log(`Plain PNG:   ${plainPng}`);
  console.log(`Plain SVG:   ${plainSvg}`);
  console.log(`Branded PNG: ${brandedPng}`);
  console.log(`Flyer A5:    ${flyerPng}`);
  console.log(`Poster A4:   ${posterPng}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
