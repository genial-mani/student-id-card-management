import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**", // This allows any image path from your Cloudinary account
      },
    ],
  },
};

export default nextConfig;