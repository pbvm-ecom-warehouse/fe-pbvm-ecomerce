import { describe, expect, it, vi } from "vitest";

describe("next config API rewrites", () => {
  it("uses NEXT_PUBLIC_ECOMMERCE_API_URL for shop API rewrites", async () => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_ECOMMERCE_API_URL", "http://localhost:3002/api/shop");

    const { default: nextConfig } = await import("../../next.config");
    const rewrites = await nextConfig.rewrites?.();

    expect(rewrites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/api/shop/:path*",
          destination: "http://localhost:3002/api/shop/:path*",
        }),
      ]),
    );

    vi.unstubAllEnvs();
  });
});
