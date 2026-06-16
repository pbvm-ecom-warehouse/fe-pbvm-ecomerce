import { describe, expect, it } from "vitest";

import { buildApiUrl, getApiErrorCode, unwrapApiData } from "@/lib/api-contract";

describe("ecommerce API contract helpers", () => {
  it("unwraps backend success envelopes", () => {
    expect(
      unwrapApiData({
        data: { accessToken: "access-1" },
        meta: { requestId: "req-1" },
      }),
    ).toEqual({ accessToken: "access-1" });
  });

  it("keeps raw payloads usable during endpoint migration", () => {
    expect(unwrapApiData({ accessToken: "legacy-access" })).toEqual({
      accessToken: "legacy-access",
    });
  });

  it("preserves the /api/shop prefix when building ecommerce URLs", () => {
    expect(buildApiUrl("http://localhost:3002", "/catalog/products")).toBe(
      "http://localhost:3002/api/shop/catalog/products",
    );
  });

  it("reads stable backend error codes", () => {
    expect(
      getApiErrorCode({
        response: {
          data: {
            error: { code: "UNAUTHENTICATED", message: "Token expired" },
          },
        },
      }),
    ).toBe("UNAUTHENTICATED");
  });
});
