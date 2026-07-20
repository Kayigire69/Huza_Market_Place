const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const sharp = require("sharp");

const url = "https://www.youthhuza.rw/farmer";
const out = path.join(__dirname, "..", "public", "qr");
const logoPath = path.join(__dirname, "..", "public", "images", "youth-huza-logo.png");

const opts = {
  errorCorrectionLevel: "H",
  margin: 2,
  color: { dark: "#0B5C34", light: "#FFFFFF" },
};

async function main() {
  fs.mkdirSync(out, { recursive: true });

  await QRCode.toFile(path.join(out, "youthhuza-farmer-qr.png"), url, {
    ...opts,
    type: "png",
    width: 1200,
  });
  await QRCode.toFile(path.join(out, "youthhuza-farmer-qr.svg"), url, {
    ...opts,
    type: "svg",
    width: 1200,
  });

  const qr = await QRCode.toBuffer(url, { ...opts, type: "png", width: 1200 });
  const logoSize = 264;
  const badgeSize = 312;
  const badgeSvg = Buffer.from(
    `<svg width="${badgeSize}" height="${badgeSize}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" rx="56" fill="#FFFFFF"/></svg>`
  );
  const logo = await sharp(logoPath)
    .resize(logoSize, logoSize, {
      fit: "contain",
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
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

  await sharp(qr)
    .composite([
      {
        input: badgeWithLogo,
        left: Math.round((1200 - badgeSize) / 2),
        top: Math.round((1200 - badgeSize) / 2),
      },
    ])
    .toFile(path.join(out, "youthhuza-farmer-qr-branded.png"));

  // A5 flyer
  const flyerW = 1748;
  const flyerH = 2480;
  const qrSize = 920;
  const brandedQr = await sharp(path.join(out, "youthhuza-farmer-qr-branded.png"))
    .resize(qrSize, qrSize)
    .png()
    .toBuffer();
  const logoW = Math.round(flyerW * 0.42);
  const topLogo = await sharp(logoPath).resize(logoW, null, { fit: "inside" }).png().toBuffer();
  const topMeta = await sharp(topLogo).metadata();
  const pad = Math.round(flyerW * 0.08);
  const headlineY = pad + (topMeta.height || 0) + Math.round(flyerH * 0.04);
  const qrTop = headlineY + Math.round(flyerW * 0.08);
  const urlY = qrTop + qrSize + Math.round(flyerH * 0.05);
  const flyerSvg = Buffer.from(`<svg width="${flyerW}" height="${flyerH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#E8F5EC"/>
    <rect x="0" y="0" width="100%" height="21" fill="#0B5C34"/>
    <text x="50%" y="${headlineY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="700" fill="#0B5C34">Scan to open Farmers Portal</text>
    <text x="50%" y="${headlineY + 70}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="56" fill="#2D4A38">Login or register with Youth Huza</text>
    <text x="50%" y="${urlY}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700" fill="#0B5C34">www.youthhuza.rw/farmer</text>
    <text x="50%" y="${urlY + 70}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="48" fill="#4A6354">Farmers Portal · Youth Huza</text>
  </svg>`);
  await sharp(flyerSvg)
    .composite([
      {
        input: topLogo,
        left: Math.round((flyerW - (topMeta.width || logoW)) / 2),
        top: pad,
      },
      {
        input: brandedQr,
        left: Math.round((flyerW - qrSize) / 2),
        top: qrTop,
      },
    ])
    .toFile(path.join(out, "youthhuza-farmer-flyer-a5.png"));

  console.log("Farmer QR assets ready");
  console.log("URL:", url);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
