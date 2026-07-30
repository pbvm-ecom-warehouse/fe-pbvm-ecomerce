import type { CatalogProduct, ProductVariant } from "@/types/api";

function firstText(...values: Array<unknown>) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

export function getProductKind(
  product: CatalogProduct,
  variant?: ProductVariant | null,
): "cup" | "ingredient" | "packaging" | "generic" {
  const skuPrefix = String(
    variant?.sku || product.productRefId || (product as any).sku || "",
  )
    .split("-")[0]
    ?.toUpperCase();
  if (skuPrefix === "MAT") return "ingredient";
  if (skuPrefix === "CUP") return "cup";
  if (skuPrefix === "PKG") return "packaging";

  const source = [
    product.category,
    product.categoryName,
    (product as any).categoryObj?.slug,
    (product as any).categoryObj?.name,
    product.slug,
    product.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    source.includes("nguyen lieu") ||
    source.includes("ingredient") ||
    source.includes("tra") ||
    source.includes("sua") ||
    source.includes("bot") ||
    source.includes("siro") ||
    source.includes("topping")
  ) {
    return "ingredient";
  }
  if (source.includes("bao bi") || source.includes("packaging")) return "packaging";
  if (
    source.includes("plain_cup") ||
    source.includes("printed_cup") ||
    source.includes("custom_print") ||
    source.includes("ly") ||
    source.includes("cup")
  ) {
    return "cup";
  }
  return "generic";
}

export function getVariantDisplayProductName(
  product: CatalogProduct,
  variant?: ProductVariant | null,
) {
  if (!product) return "";

  const variantName = firstText(
    (variant as any)?.name,
    (variant as any)?.variantName,
    (variant as any)?.title,
  );

  if (variantName) {
    return variantName;
  }

  if (product.name && String(product.name).trim()) {
    return String(product.name).trim();
  }

  return (variant?.sku || product.productRefId || "").trim();
}

export function getVariantDisplayName(
  product: CatalogProduct,
  variant?: any,
) {
  return getVariantDisplayProductName(product, variant);
}
