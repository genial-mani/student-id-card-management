import type { NextConfig } from "next";

// Extract hostname from R2_PUBLIC_URL for Next.js Image optimization
const r2PublicUrl = process.env.R2_PUBLIC_URL || "";
let r2Hostname = "";
try {
  if (r2PublicUrl) {
    r2Hostname = new URL(r2PublicUrl).hostname;
  }
} catch {
  // R2_PUBLIC_URL not set or invalid — skip
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // This allows any image path from your Cloudinary account
      },
      // R2 public access via *.r2.dev subdomain
      {
        protocol: "https",
        hostname: "*.r2.dev",
        pathname: "/**",
      },
      // R2 custom domain (if configured)
      ...(r2Hostname
        ? [
            {
              protocol: "https" as const,
              hostname: r2Hostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;