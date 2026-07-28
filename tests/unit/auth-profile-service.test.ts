import { beforeEach, describe, expect, it, vi } from "vitest";

import { updateProfile } from "@/features/auth/services/auth.service";
import { apiClient } from "@/lib/api-client";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

const mockedPatch = vi.mocked(apiClient.patch);
const mockedPost = vi.mocked(apiClient.post);

describe("auth profile service", () => {
  beforeEach(() => {
    mockedPatch.mockReset();
    mockedPost.mockReset();
  });

  it("persists profile fields through the backend profile endpoint", async () => {
    mockedPatch.mockResolvedValueOnce({
      data: {
        data: {
          id: "user-1",
          name: "PBVM Bakery",
          phone: "0900000000",
          customerType: "B2B",
          avatarUrl: "https://cdn.example/avatar.png",
        },
        meta: {},
      },
    });

    const result = await updateProfile({
      name: "PBVM Bakery",
      phone: "0900000000",
      customerType: "B2B",
    });

    expect(mockedPatch).toHaveBeenCalledWith("/auth/profile", {
      name: "PBVM Bakery",
      phone: "0900000000",
      customerType: "B2B",
    });
    expect(result).toMatchObject({
      name: "PBVM Bakery",
      phone: "0900000000",
      customerType: "B2B",
      avatar: "https://cdn.example/avatar.png",
    });
  });

  it("uploads avatar files through the backend avatar endpoint", async () => {
    const file = new File(["avatar"], "avatar.png", { type: "image/png" });
    mockedPost.mockResolvedValueOnce({
      data: {
        data: {
          id: "user-1",
          avatarUrl: "https://cdn.example/avatar.png",
        },
        meta: {},
      },
    });

    const result = await updateProfile({ avatarFile: file });

    expect(mockedPost).toHaveBeenCalledWith(
      "/auth/me/avatar",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    expect(result.avatar).toBe("https://cdn.example/avatar.png");
  });
});
