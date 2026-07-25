import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import {
  clearAuthTokens,
  getRefreshToken,
  setAuthTokens,
  setTenantId,
} from "@/lib/auth-token";
import { useAuthStore } from "@/stores/auth-store";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

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
 * Cập nhật thông tin cá nhân và upload avatar lên Backend
 */
export async function updateProfile(input: { name?: string; phone?: string; avatar?: string; customerType?: string }) {
  let updatedAvatarUrl = input.avatar;

  if (input.avatar && input.avatar.startsWith("data:")) {
    try {
      const arr = input.avatar.split(",");
      const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png";
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const fileObj = new File([u8arr], "avatar.png", { type: mime });

      const formData = new FormData();
      formData.append("file", fileObj);

      const response = await apiClient.post<any>("/auth/me/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = unwrapApiData(response.data);
      if (data?.avatar || data?.avatarUrl) {
        updatedAvatarUrl = data.avatar || data.avatarUrl;
      }
    } catch (err) {
      console.warn("Upload avatar to BE failed, using local avatar fallback:", err);
    }
  }

  return {
    ...input,
    avatar: updatedAvatarUrl,
  };
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
