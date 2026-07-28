import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClientMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiClient: apiClientMock,
}));

import { updateDesign } from "@/features/cup-designer/services/design.service";

describe("design service", () => {
  beforeEach(() => {
    apiClientMock.patch.mockReset();
  });

  it("updates a saved design through the backend design endpoint", async () => {
    apiClientMock.patch.mockResolvedValueOnce({
      data: {
        data: {
          id: "design-1",
          name: "Mau ly moi",
          file: "https://cdn.example/design.png",
          thumbnail: "https://cdn.example/thumb.png",
        },
        meta: {},
      },
    });

    const result = await updateDesign("design-1", {
      name: "Mau ly moi",
    });

    expect(apiClientMock.patch).toHaveBeenCalledWith("/designs/design-1", {
      name: "Mau ly moi",
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: "design-1",
        name: "Mau ly moi",
      }),
    );
  });
});
