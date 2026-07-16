import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import {
  clearAuthTokens,
  getRefreshToken,
  setAuthTokens,
  setTenantId,
} from "@/lib/auth-token";
import { useAuthStore } from "@/stores/auth-store";

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

export async function getMe() {
  const response = await apiClient.get<ApiEnvelope<any> | any>("/auth/me");
  return unwrapApiData(response.data);
}

export async function changePassword(input: any) {
  const response = await apiClient.post<ApiEnvelope<any> | any>("/auth/change-password", input);
  return unwrapApiData(response.data);
}

/**
 * Profile update — BE chưa có endpoint này.
 * Chỉ trả về dữ liệu input để cập nhật client-side state.
 */
export async function updateProfile(input: { name?: string; phone?: string; avatar?: string; customerType?: string }) {
  // TODO: Kết nối khi BE implement PATCH /auth/profile
  return input;
}

export async function loginWithGoogle() {
  const { auth, googleProvider, isFirebaseConfigured } = await import("@/lib/firebase");

  if (!isFirebaseConfigured || !auth) {
    throw new Error("Cấu hình Firebase chưa được thiết lập. Vui lòng thêm biến môi trường NEXT_PUBLIC_FIREBASE_API_KEY và NEXT_PUBLIC_FIREBASE_APP_ID.");
  }

  const { signInWithPopup } = await import("firebase/auth");
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
