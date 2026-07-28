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

  it("does not call a promotion endpoint that the backend has not exposed", async () => {
    await expect(validatePromotion({
      code: "B2BSTART",
      orderValue: 1_000_000,
    })).rejects.toThrow("BE chưa có API /promotions/validate");

    expect(mockedPost).not.toHaveBeenCalled();
  });
});
