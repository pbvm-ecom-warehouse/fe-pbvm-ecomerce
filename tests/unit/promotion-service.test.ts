import { beforeEach, describe, expect, it, vi } from "vitest";

import { validatePromotion } from "@/features/promotion/promotion-rules";
import { apiClient } from "@/lib/api-client";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    post: vi.fn(),
  },
}));

const mockedPost = vi.mocked(apiClient.post);

describe("promotion service", () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it("validates promotion codes through the backend", async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        data: {
          valid: true,
          code: "B2BSTART",
          discountAmount: 50_000,
          message: "Applied",
        },
        meta: {},
      },
    });

    const result = await validatePromotion({
      code: "B2BSTART",
      orderValue: 1_000_000,
    });

    expect(mockedPost).toHaveBeenCalledWith("/promotions/validate", {
      code: "B2BSTART",
      orderValue: 1_000_000,
    });
    expect(result).toEqual({
      valid: true,
      code: "B2BSTART",
      discountAmount: 50_000,
      message: "Applied",
    });
  });
});
