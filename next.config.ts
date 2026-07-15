import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin workspace root — parent folder had a stray lockfile that confused Next.js
  outputFileTracingRoot: projectRoot,
  // pdfkit ships AFM font files; bundling into .next breaks Helvetica paths.
  // ioredis uses node: APIs — keep it external so Edge/middleware never bundles it.
  serverExternalPackages: ["pdfkit", "ioredis"],
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Keep recently visited pages warm in the client router so forward
  // navigation feels closer to Back (without changing UI or features).
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
