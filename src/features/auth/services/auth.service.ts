import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import {
  clearAuthTokens,
  getRefreshToken,
  setAuthTokens,
  setTenantId,
} from "@/lib/auth-token";
import { type CustomerSession, useAuthStore } from "@/stores/auth-store";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { env } from "@/lib/env";

import type { LoginInput, RegisterInput } from "../schemas/login.schema";

export async function login(input: LoginInput) {
  type LoginResponse = { accessToken: string; refreshToken: string };
  const payload = {
    email: input.email,
    password: input.password,
  };
  const response = await apiClient.post<ApiEnvelope<LoginResponse> | LoginResponse>(
    "/auth/login",
    payload,
  );
  const data = unwrapApiData(response.data);

  setAuthTokens(data);
  setTenantId(input.tenantId);

  return data;
}

export async function register(input: RegisterInput) {
  type RegisterResponse = { customerId: string };
  // The backend RegisterDto accepts email, password, name, phone.
  // We explicitly select only these fields to prevent validation issues with extra properties.
  const payload = {
    email: input.email,
    password: input.password,
    name: input.name,
    phone: input.phone,
  };
  const response = await apiClient.post<
    ApiEnvelope<RegisterResponse> | RegisterResponse
  >(
    "/auth/register",
    payload,
  );

  return unwrapApiData(response.data);
}

export async function logout() {
  const refreshToken = getRefreshToken();

  try {
    await apiClient.post("/auth/logout", refreshToken ? { refreshToken } : {});
  } finally {
    clearAuthTokens();
    useAuthStore.getState().setUser(null);
  }
}

type EcomMeResponse = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  type: "customer" | "admin";
  customerType?: "B2B" | "B2C";
  tenantId?: string;
  avatar?: string;
  avatarUrl?: string;
};

type AuthenticatedCustomerSession = CustomerSession & {
  email: string;
};

export async function getMe(): Promise<AuthenticatedCustomerSession> {
  const response = await apiClient.get<ApiEnvelope<EcomMeResponse> | EcomMeResponse>("/auth/me");
  const data = unwrapApiData(response.data);
  return {
    id: data.id,
    email: data.email,
    name: data.name || data.email,
    type: data.type,
    customerType: data.customerType || "B2B",
    tenantId: data.tenantId || env.NEXT_PUBLIC_DEFAULT_TENANT_ID,
    phone: data.phone,
    avatar: data.avatar ?? data.avatarUrl,
  };
}

type ChangePasswordInput = {
  oldPassword: string;
  newPassword: string;
};

type SuccessResponse = {
  success?: boolean;
  message?: string;
};

export async function changePassword(input: ChangePasswordInput) {
  const response = await apiClient.post<ApiEnvelope<SuccessResponse> | SuccessResponse>("/auth/change-password", input);
  return unwrapApiData(response.data);
}

/**
 * Cập nhật thông tin cá nhân và upload avatar lên Backend
 */
export type UpdateProfileInput = {
  name?: string;
  phone?: string;
  avatar?: string;
  avatarFile?: File;
  customerType?: "B2B" | "B2C";
};

type ProfileResponse = Partial<CustomerSession> & {
  avatarUrl?: string;
};

function normalizeProfileResponse(data: ProfileResponse) {
  return {
    ...data,
    avatar: data?.avatar ?? data?.avatarUrl,
  };
}

export async function updateProfile(input: UpdateProfileInput) {
  if (input.avatarFile) {
    const formData = new FormData();
    formData.append("file", input.avatarFile);

    const response = await apiClient.post<
      ApiEnvelope<ProfileResponse> | ProfileResponse
    >("/auth/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return normalizeProfileResponse(unwrapApiData(response.data));
  }

  const payload = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.phone !== undefined ? { phone: input.phone } : {}),
    ...(input.avatar !== undefined ? { avatar: input.avatar } : {}),
    ...(input.customerType !== undefined ? { customerType: input.customerType } : {}),
  };

  const response = await apiClient.patch<
    ApiEnvelope<ProfileResponse> | ProfileResponse
  >("/auth/profile", payload);
  return normalizeProfileResponse(unwrapApiData(response.data));
}

export async function loginWithGoogle() {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Cấu hình Firebase chưa được thiết lập. Vui lòng thêm biến môi trường NEXT_PUBLIC_FIREBASE_API_KEY và NEXT_PUBLIC_FIREBASE_APP_ID.");
  }

  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();

  type LoginResponse = { accessToken: string; refreshToken: string };
  const response = await apiClient.post<ApiEnvelope<LoginResponse> | LoginResponse>(
    "/auth/google-login",
    { idToken },
  );
  const data = unwrapApiData(response.data);

  setAuthTokens(data);
  setTenantId("demo-tenant");

  return data;
}
