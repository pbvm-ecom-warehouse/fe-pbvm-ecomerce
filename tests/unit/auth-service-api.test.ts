import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClientMock = vi.hoisted(() => ({
  post: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  apiClient: apiClientMock,
}));

vi.mock("@/lib/firebase", () => ({
  auth: null,
  googleProvider: null,
  isFirebaseConfigured: false,
}));

import {
  createEcomManager,
  forgotPassword,
  resendVerifyEmail,
  resetPassword,
  verifyEmail,
} from "@/features/auth/services/auth.service";

describe("auth service API wrappers", () => {
  beforeEach(() => {
    apiClientMock.post.mockReset();
    apiClientMock.post.mockResolvedValue({ data: { data: { success: true }, meta: {} } });
  });

  it("connects email verification endpoints from the backend", async () => {
    await verifyEmail({ email: "user@example.com", code: "123456" });
    await resendVerifyEmail();

    expect(apiClientMock.post).toHaveBeenNthCalledWith(1, "/auth/verify-email", {
      email: "user@example.com",
      code: "123456",
    });
    expect(apiClientMock.post).toHaveBeenNthCalledWith(2, "/auth/resend-verify-email");
  });

  it("connects password reset endpoints from the backend", async () => {
    await forgotPassword("user@example.com");
    await resetPassword({
      email: "user@example.com",
      code: "654321",
      newPassword: "NewP@ssw0rd123!",
    });

    expect(apiClientMock.post).toHaveBeenNthCalledWith(1, "/auth/forgot-password", {
      email: "user@example.com",
    });
    expect(apiClientMock.post).toHaveBeenNthCalledWith(2, "/auth/reset-password", {
      email: "user@example.com",
      code: "654321",
      newPassword: "NewP@ssw0rd123!",
    });
  });

  it("connects the admin create-manager endpoint from the backend", async () => {
    await createEcomManager({
      email: "manager@example.com",
      password: "P@ssw0rd123!",
      name: "Manager",
    });

    expect(apiClientMock.post).toHaveBeenCalledWith("/auth/admin/create-manager", {
      email: "manager@example.com",
      password: "P@ssw0rd123!",
      name: "Manager",
    });
  });
});
