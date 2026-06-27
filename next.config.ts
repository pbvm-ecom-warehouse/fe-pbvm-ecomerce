import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/shop/:path*",
        destination: "https://api-ecom-wms.hoaiphuong.io.vn/api/shop/:path*",
      },
    ];
  },
};

export default nextConfig;
