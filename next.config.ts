import type { NextConfig } from "next";

const DEFAULT_API_ORIGIN = "https://api-ecom-wms.hoaiphuong.io.vn";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function buildApiRewriteDestination(baseUrl: string | undefined, apiPrefix: string) {
  const cleanBase = trimTrailingSlash(baseUrl || DEFAULT_API_ORIGIN);
  const cleanPrefix = apiPrefix.replace(/\/+$/, "");
  const targetBase = cleanBase.endsWith(cleanPrefix)
    ? cleanBase
    : `${cleanBase}${cleanPrefix}`;

  return `${targetBase}/:path*`;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "image.pollinations.ai",
      },
      {
        protocol: "https",
        hostname: "gen.pollinations.ai",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/shop/:path*",
        destination: buildApiRewriteDestination(
          process.env.NEXT_PUBLIC_ECOMMERCE_API_URL,
          "/api/shop",
        ),
      },
      {
        source: "/api/wms/:path*",
        destination: buildApiRewriteDestination(
          process.env.NEXT_PUBLIC_WMS_API_URL ||
            process.env.NEXT_PUBLIC_ECOMMERCE_API_URL,
          "/api/wms",
        ),
      },
    ];
  },
};

export default nextConfig;
