import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  getWmsAccessTokenOnly,
  getTenantId,
  setWmsAccessToken,
} from "@/lib/auth-token";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";
import { env } from "@/lib/env";

type RetryRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const wmsApiClient = axios.create({
  baseURL:
    typeof window !== "undefined"
      ? "/api/wms"
      : `${env.NEXT_PUBLIC_ECOMMERCE_API_URL}/api/wms`,
  timeout: 60_000,
  headers: {
    "Content-Type": "application/json",
    "X-Tenant-ID": env.NEXT_PUBLIC_DEFAULT_TENANT_ID,
  },
});

export async function ensureWmsToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const existing = getWmsAccessTokenOnly() || getAccessToken();
  if (existing) return existing;

  try {
    const loginUrl =
      typeof window !== "undefined"
        ? "/api/wms/auth/login"
        : `${env.NEXT_PUBLIC_ECOMMERCE_API_URL}/api/wms/auth/login`;

    let res = await axios.post(
      loginUrl,
      { username: "admin", password: "P@ssw0rd123!" },
      {
        headers: { "X-Tenant-ID": env.NEXT_PUBLIC_DEFAULT_TENANT_ID },
        validateStatus: (status) => status < 500,
      },
    );

    if (res.status < 200 || res.status >= 300) {
      res = await axios.post(
        loginUrl,
        { username: "seed_manager", password: "Seed@12345" },
        {
          headers: { "X-Tenant-ID": env.NEXT_PUBLIC_DEFAULT_TENANT_ID },
          validateStatus: (status) => status < 500,
        },
      );
    }

    if (res.status >= 200 && res.status < 300) {
      const data = unwrapApiData(res.data);
      if (data && data.accessToken) {
        setWmsAccessToken(data.accessToken);
        return data.accessToken;
      }
    }
  } catch (err) {
    console.warn("Auto WMS token acquisition failed:", err);
  }
  return null;
}

wmsApiClient.interceptors.request.use(async (config) => {
  let token = getWmsAccessTokenOnly();
  if (!token) {
    token = await ensureWmsToken();
  }

  const tenantId = getTenantId(env.NEXT_PUBLIC_DEFAULT_TENANT_ID);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers["X-Tenant-ID"] = tenantId;

  return config;
});

wmsApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (typeof window !== "undefined") {
      window.localStorage.removeItem("wms_access_token");
    }

    try {
      const freshToken = await ensureWmsToken();
      if (freshToken) {
        originalRequest.headers.Authorization = `Bearer ${freshToken}`;
        return wmsApiClient(originalRequest);
      }
    } catch (refreshError) {
      console.error("Failed to refresh WMS token:", refreshError);
    }

    return Promise.reject(error);
  },
);
