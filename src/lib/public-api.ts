import { env } from "@/lib/env";
import { buildApiUrl, unwrapApiData } from "@/lib/api-contract";

type NextFetchInit = RequestInit & {
  next?: {
    revalidate?: number;
    tags?: string[];
  };
};

/** Tự động gán cache tag dựa trên path API */
function inferCacheTags(path: string): string[] {
  const tags: string[] = [];
  if (path.includes("/catalog/products")) tags.push("catalog-products");
  if (path.includes("/catalog/categories")) tags.push("catalog-categories");
  return tags;
}

function buildPublicApiUrl(path: string) {
  return buildApiUrl(env.NEXT_PUBLIC_ECOMMERCE_API_URL, path);
}

export async function publicApiFetch<T>(
  path: string,
  init: NextFetchInit = {},
  maxRetries = 0,
): Promise<T> {
  const autoTags = inferCacheTags(path);
  const nextInit = init.next ?? {};
  const mergedTags = [...new Set([...(nextInit.tags ?? []), ...autoTags])];

  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(buildPublicApiUrl(path), {
        ...init,
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": env.NEXT_PUBLIC_DEFAULT_TENANT_ID,
          ...init.headers,
        },
        cache: "no-store",
        next: {
          revalidate: 0,
          ...(mergedTags.length > 0 ? { tags: mergedTags } : {}),
        },
      });

      if (response.ok) {
        return unwrapApiData((await response.json()) as T);
      }

      if (response.status === 429) {
        console.warn(`[publicApiFetch] Rate limited (429) for ${path}`);
        throw new Error(`Public API rate limited: 429`);
      }

      // Retry automatically only on 502 Bad Gateway / 503 / 504 proxy errors
      if (
        (response.status === 502 || response.status === 503 || response.status === 504) &&
        attempt < maxRetries
      ) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }

      throw new Error(`Public API request failed: ${response.status}`);
    } catch (err: any) {
      lastError = err;
      const isGatewayError = String(err?.message || err).includes("502") || String(err?.message || err).includes("503");
      if (isGatewayError && attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      break;
    }
  }

  throw lastError || new Error(`Public API request failed for ${path}`);
}
