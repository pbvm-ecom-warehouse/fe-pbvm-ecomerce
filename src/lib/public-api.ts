import { env } from "@/lib/env";

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
  };
};

function buildPublicApiUrl(path: string) {
  return new URL(path, env.NEXT_PUBLIC_ECOMMERCE_API_URL).toString();
}

export async function publicApiFetch<T>(
  path: string,
  init: NextFetchInit = {},
) {
  const response = await fetch(buildPublicApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Tenant-ID": env.NEXT_PUBLIC_DEFAULT_TENANT_ID,
      ...init.headers,
    },
    next: init.next ?? { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Public API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
