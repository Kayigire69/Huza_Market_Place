import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const deploymentId =
  process.env.DIGITALOCEAN_DEPLOYMENT_ID?.trim() ||
  process.env.COMMIT_HASH?.trim() ||
  process.env.GITHUB_SHA?.trim() ||
  undefined;

const nextConfig: NextConfig = {
  // Pin workspace root — parent folder had a stray lockfile that confused Next.js
  outputFileTracingRoot: projectRoot,
  // Soft skew protection when the host injects a deploy/commit id
  ...(deploymentId ? { deploymentId } : {}),
  // pdfkit ships AFM font files; bundling into .next breaks Helvetica paths
  serverExternalPackages: ["pdfkit"],
  // App Platform omits most devDependencies; typecheck still runs.
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 78],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
    // Image optimizer CSP sandboxes SVGs; catalog fallbacks may use SVG placeholders
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    // Keep client router cache short so post-deploy tabs pick up new assets faster
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
