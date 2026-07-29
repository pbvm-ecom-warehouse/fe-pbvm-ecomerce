"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  Box,
  CheckCircle2,
  ChevronRight,
  Cpu,
  FileText,
  GitCompare,
  Heart,
  Home,
  Paintbrush,
  Search,
  ShieldCheck,
  Tag,
  Truck,
  Warehouse,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/features/catalog/components/add-to-cart-button";
import type { CatalogProduct, ProductVariant } from "@/types/api";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/lib/utils";
import {
  collectVariantAttributes,
  normalizeVariantAttributes,
} from "@/features/catalog/utils/variant-attributes";

const categoryCopy: Record<string, string> = {
  ingredient: "Nguyên liệu",
  plain_cup: "Ly chưa in",
  printed_cup: "Ly đã in",
  custom_print: "Ly in theo yêu cầu",
};

function getVendorName(product: CatalogProduct | null) {
  if (!product) return "";
  return (
    (product as any).vendorName ||
    (product as any).supplierName ||
    (product as any).brandName ||
    ""
  );
}

function getProductImages(product: CatalogProduct | null): string[] {
  if (!product) return [];
  return Array.from(new Set([product.imageUrl, ...(product.images || [])].filter(Boolean)));
}

function getProductSizes(product: CatalogProduct | null): string[] {
  if (!product) return [];
  if (product.variants && product.variants.length > 0) {
    const extracted = product.variants
      .map((v) => {
        const attrs = collectVariantAttributes(v);
        const sizeAttr =
          attrs.capacity ||
          attrs.size ||
          attrs.weight ||
          attrs.spec ||
          attrs["dung tích"];
        if (sizeAttr) return sizeAttr;

        const text = `${v.sku} ${v.attributes ? JSON.stringify(v.attributes) : ""}`.toLowerCase();
        if (text.includes("1000")) return "1000ml";
        if (text.includes("750") || text.includes("700")) return "700ml";
        if (text.includes("500")) return "500ml";
        if (text.includes("350")) return "350ml";
        return null;
      })
      .filter((s): s is string => Boolean(s));

    const uniqueSizes = Array.from(new Set(extracted));
    if (uniqueSizes.length > 0) {
      return uniqueSizes;
    }
  }

  return [];
}

function getVariantLabel(v: ProductVariant): string {
  const attrs = normalizeVariantAttributes(collectVariantAttributes(v), v.sku || "");
  return attrs.capacity || attrs.style || attrs.material || attrs.color || v.sku;
}

function getVariantAttribute(v: ProductVariant, key: "capacity" | "style" | "material" | "color") {
  return normalizeVariantAttributes(collectVariantAttributes(v), v.sku || "")[key];
}

function getVariantDisplayRows(variant: ProductVariant) {
  const attrs = collectVariantAttributes(variant);
  const sku = String(variant.sku || "").toUpperCase();
  const prefix = sku.split("-")[0];
  const rows =
    prefix === "MAT"
      ? [
          ["Danh mục", attrs.category],
          ["Loại", attrs.type || attrs.material],
          ["Hương vị", attrs.flavor],
          ["Quy cách", attrs.weight || attrs.spec || attrs.size],
        ]
      : prefix === "PKG"
        ? [
            ["Loại bao bì", attrs.packaging || attrs.style],
            ["Kích thước", attrs.size || attrs.capacity],
            ["Chất liệu", attrs.material],
            ["Màu sắc", attrs.color],
          ]
        : [
            ["Dung tích", attrs.capacity || attrs.size],
            ["Kiểu dáng", attrs.style],
            ["Chất liệu", attrs.material],
            ["Màu sắc", attrs.color],
          ];

  return rows
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
    .map(([label, value]) => ({ label: String(label), value: String(value).trim() }));
}

export function ProductDetailView({
  initialProduct,
  slug: targetSlug,
}: {
  initialProduct?: CatalogProduct | null;
  slug?: string;
}) {
  const [product, setProduct] = useState<CatalogProduct | null>(initialProduct ?? null);

  useEffect(() => {
    setProduct(initialProduct ?? null);
  }, [initialProduct, targetSlug]);

  const images = useMemo(() => getProductImages(product), [product]);
  const sizes = useMemo(() => getProductSizes(product), [product]);

  const hasVariants = Boolean(product?.variants && product.variants.length > 0);

  const [activeImage, setActiveImage] = useState(images[0]);

  useEffect(() => {
    if (images[0]) {
      setActiveImage(images[0]);
    }
  }, [images]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [selectedVariantAttrs, setSelectedVariantAttrs] = useState<
    Partial<Record<"capacity" | "style" | "material" | "color", string>>
  >({});
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "vendor">("desc");

  const variantOptionGroups = useMemo(() => {
    if (!product?.variants?.length) return [];
    const variants = product.variants;
    const fields = [
      { key: "capacity" as const, label: "Dung tích" },
      { key: "style" as const, label: "Kiểu dáng" },
      { key: "material" as const, label: "Chất liệu" },
      { key: "color" as const, label: "Màu sắc" },
    ];

    return fields
      .map((field) => {
        const values = variants
          .map((variant) => getVariantAttribute(variant, field.key))
          .filter((value): value is string => Boolean(value));
        return {
          ...field,
          values: Array.from(new Set(values)),
        };
      })
      .filter((group) => group.values.length > 0);
  }, [product]);

  const selectVariantByAttribute = (
    key: "capacity" | "style" | "material" | "color",
    value: string,
  ) => {
    setSelectedVariantAttrs((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    setSelectedVariantAttrs({});
    const firstVariant = product?.variants?.[0];
    setSelectedVariantId(
      firstVariant ? String(firstVariant.id || firstVariant.sku || "") : "",
    );
  }, [product?.id, product?.slug, product?.variants]);

  const selectedVariantEntries = useMemo(
    () => Object.entries(selectedVariantAttrs).filter(([, value]) => Boolean(value)),
    [selectedVariantAttrs],
  );

  const isVariantComboComplete =
    variantOptionGroups.length > 0 &&
    variantOptionGroups.every((group) => Boolean(selectedVariantAttrs[group.key]));

  const selectedVariant = useMemo(() => {
    if (!product || !hasVariants || !product.variants || product.variants.length === 0) return null;
    if (selectedVariantId) {
      const byId = product.variants.find(
        (variant) => String(variant.id || variant.sku || "") === selectedVariantId,
      );
      if (byId) return byId;
    }
    if (!isVariantComboComplete) return product.variants[0] ?? null;

    return (
      product.variants.find((variant) => {
        const attrs = normalizeVariantAttributes(collectVariantAttributes(variant), variant.sku || "");
        return selectedVariantEntries.every(
          ([key, value]) => attrs[key as keyof typeof attrs] === value,
        );
      }) ?? null
    );
  }, [product, hasVariants, selectedVariantId, isVariantComboComplete, selectedVariantEntries]);

  const isVariantComboUnavailable = isVariantComboComplete && !selectedVariant;

  const activePrice = selectedVariant ? selectedVariant.price : ((product?.b2bPrice || product?.price) ?? 0);
  const hasSalePrice = Boolean(product && activePrice > 0 && product.price > activePrice);
  const discountPercent = hasSalePrice && product
    ? Math.round(((product.price - activePrice) / product.price) * 100)
    : 0;

  const isCustomPrint = selectedVariant
    ? selectedVariant.fulfillmentType === "CUSTOM_PRINT"
    : product?.fulfillmentType === "CUSTOM_PRINT";

  const activeStock = selectedVariant ? (selectedVariant.availableQty ?? 0) : 0;
  const isSelectedVariantOutOfStock = Boolean(selectedVariant && activeStock <= 0);
  const isVariantSelectionBlocked = isVariantComboUnavailable || isSelectedVariantOutOfStock;

  const activeLabel = selectedVariant
    ? getVariantLabel(selectedVariant)
    : selectedVariantEntries.map(([, value]) => value).join(" / ") || selectedSize || "";

  const selectedVariantAttributes = selectedVariant
    ? normalizeVariantAttributes(collectVariantAttributes(selectedVariant), selectedVariant.sku || "")
    : null;
  const allVariantAttributeGroups = useMemo(() => {
    if (!product?.variants?.length) return [];
    return product.variants.map((variant, index) => ({
      id: variant.id || variant.sku || `variant-${index}`,
      sku: variant.sku || `#${index + 1}`,
      price: variant.price,
      availableQty: variant.availableQty,
      image: variant.image || product.imageUrl || product.images?.[0] || "/images/product-placeholder.svg",
      rows: getVariantDisplayRows(variant),
    }));
  }, [product]);
  const activeProductToAddToCart = useMemo(() => {
    if (!product) return null;
    if (!selectedVariant) return null;
    return {
      ...product,
      price: selectedVariant.price,
      b2bPrice: selectedVariant.price,
      productRefId: selectedVariant.sku,
      stockSnapshot: selectedVariant.availableQty,
    };
  }, [product, selectedVariant]);

  const isCupProduct = useMemo(() => {
    if (!product) return false;
    const nameLower = product.name.toLowerCase();
    return (
      product.category === "plain_cup" ||
      product.category === "printed_cup" ||
      product.category === "custom_print" ||
      product.slug.includes("ly-") ||
      nameLower.includes("ly nhựa") ||
      nameLower.includes("ly giấy") ||
      nameLower.startsWith("ly ")
    );
  }, [product]);

  const canBeCustomDesigned = useMemo(() => {
    if (!product) return false;
    if (product.category === "printed_cup" || (product as any).isPrinted === true) return false;
    const nameLower = product.name.toLowerCase();
    return (
      product.category === "plain_cup" ||
      product.category === "custom_print" ||
      product.fulfillmentType === "CUSTOM_PRINT" ||
      nameLower.includes("phôi") ||
      nameLower.includes("trơn") ||
      (isCupProduct && !nameLower.includes("in sẵn") && !nameLower.includes("in hình"))
    );
  }, [product, isCupProduct]);
  const showCupOutOfStockBanner = canBeCustomDesigned && isSelectedVariantOutOfStock;

  const inferredMaterial = useMemo(() => {
    if (!product) return "frosted";
    const text = `${product.name} ${product.slug} ${JSON.stringify(selectedVariant?.attributes || {})}`.toLowerCase();
    if (text.includes("mờ") || text.includes("frosted") || text.includes("pp")) return "frosted";
    if (text.includes("giấy") || text.includes("paper")) return "paper";
    if (text.includes("trong") || text.includes("clear") || text.includes("pet")) return "clear";
    return "frosted";
  }, [product, selectedVariant]);

  const inferredStyle = useMemo(() => {
    if (!product) return "straight";
    const text = `${product.name} ${product.slug} ${JSON.stringify(selectedVariant?.attributes || {})}`.toLowerCase();
    if (text.includes("bầu") || text.includes("u-shape") || text.includes("đáy u")) return "u_shape";
    if (text.includes("tim") || text.includes("heart")) return "heart";
    if (text.includes("mug")) return "mug";
    return "straight";
  }, [product, selectedVariant]);

  const designCupHref = selectedVariant
    ? `/design-cup?productId=${encodeURIComponent(product?.id || "")}&productSlug=${encodeURIComponent(product?.slug || "")}&variantId=${encodeURIComponent(selectedVariant.id || "")}&sku=${encodeURIComponent(selectedVariant.sku || "")}&size=${encodeURIComponent(selectedVariantAttributes?.capacity || "")}&materialType=${encodeURIComponent(inferredMaterial)}&style=${encodeURIComponent(inferredStyle)}`
    : `/design-cup?productId=${encodeURIComponent(product?.id || "")}&productSlug=${encodeURIComponent(product?.slug || "")}`;

  const categoryLabel = useMemo(() => {
    if (!product) return "";
    if (product.categoryName) return product.categoryName;
    if ((product as any).categoryObj?.name) return (product as any).categoryObj.name;
    if (product.category === "plain_cup") return "Ly nhựa chưa in";
    if (product.category === "printed_cup") return "Ly nhựa đã in";
    if (product.category === "custom_print") return "Ly in theo yêu cầu";
    if (isCupProduct) return "Ly nhựa & Bao bì";
    return categoryCopy[product.category] || "Bao bì / Nguyên liệu";
  }, [product, isCupProduct]);

  if (!product) {
    return (
      <div className="container min-h-[60vh] flex flex-col items-center justify-center text-center py-16">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          Sản phẩm không tồn tại
        </h2>
        <p className="text-muted-foreground mb-6">
          Sản phẩm này có thể đã bị xóa hoặc đường dẫn không đúng.
        </p>
        <Button asChild className="bg-[#3BB77E] hover:bg-[#299e69] text-white">
          <Link href="/products">Quay lại danh sách sản phẩm</Link>
        </Button>
      </div>
    );
  }

  const activeSku = product.productRefId || "-";
  const displayStock = selectedVariant ? selectedVariant.availableQty : product.stockSnapshot;

  return (
    <main className="min-h-screen bg-white text-foreground">
      {/* BREADCRUMB */}
      <div className="border-b border-[#E2EDE8] bg-white">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-1.5 px-4 py-3 lg:px-8 text-xs font-medium text-muted-foreground">
          <Link href="/" className="inline-flex items-center gap-1 hover:text-[#3BB77E] transition-colors">
            <Home className="size-3.5" />
            Trang chủ
          </Link>
          <ChevronRight className="size-3 text-gray-400" />
          <Link href="/products" className="hover:text-[#3BB77E] transition-colors">
            {categoryCopy[product.category]}
          </Link>
          <ChevronRight className="size-3 text-gray-400" />
          <span className="text-[#253D4E] font-bold truncate max-w-[200px] sm:max-w-[400px]">
            {product.name}
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
        {/* PRODUCT GRID */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* LEFT: Image Gallery */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative aspect-square w-full rounded-2xl border border-[#E2EDE8] bg-white flex items-center justify-center p-6 shadow-sm overflow-hidden group">
              {activeImage ? (
                <div className="relative h-full w-full">
                  <Image
                    src={activeImage}
                    alt={product.name}
                    fill
                    priority
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    className="object-contain transition-transform duration-300 group-hover:scale-105 mix-blend-multiply dark:mix-blend-normal"
                  />
                </div>
              ) : null}

              <button suppressHydrationWarning className="absolute right-4 top-4 size-8 flex items-center justify-center rounded-full bg-white border border-[#E2EDE8] text-gray-400 hover:text-[#3BB77E] shadow-sm active:scale-95 transition-all">
                <Search className="size-4" />
              </button>
            </div>
          </div>

          {/* RIGHT: Product Info Details */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#253D4E] dark:text-zinc-100 leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Price Block (Large) */}
            <div className="flex items-end gap-3 mt-1 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex flex-col">
                <span className="text-3xl font-black text-[#3BB77E] leading-none">
                  {formatCurrency(activePrice)}
                </span>
              </div>

              {hasSalePrice && (
                <div className="flex flex-col mb-0.5">
                  <span className="text-[10px] font-bold text-[#FD6E6E] bg-[#FEEFEA] px-2 py-0.5 rounded uppercase self-start mb-0.5">
                    {discountPercent}% Off
                  </span>
                  <span className="text-base text-muted-foreground line-through font-semibold leading-none">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              )}

              <span className="text-xs text-muted-foreground font-bold mb-1 ml-0.5">
                / {product.unit}
              </span>
            </div>

            {product.description ? (
              <p className="mt-4 line-clamp-3 max-w-xl text-xs leading-relaxed text-muted-foreground dark:text-zinc-300 md:text-sm">
                {product.description.replace(/<[^>]+>/g, "")}
              </p>
            ) : null}

            {/* Variant product rows */}
            <div className="mt-6 space-y-4">
              {hasVariants && product.variants ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Chọn biến thể sản phẩm
                  </div>
                  <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                    {product.variants.map((variant, index) => {
                      const variantKey = String(variant.id || variant.sku || `variant-${index}`);
                      const variantName = String(variant.name || product.name || variant.sku || "").trim();
                      const rows = getVariantDisplayRows(variant);
                      const attrs = normalizeVariantAttributes(collectVariantAttributes(variant), variant.sku || "");
                      const variantImage = variant.image || product.imageUrl || product.images?.[0] || "/images/product-placeholder.svg";
                      const isActive = selectedVariant
                        ? String(selectedVariant.id || selectedVariant.sku || "") === variantKey
                        : selectedVariantId === variantKey;
                      const stock = variant.availableQty ?? 0;

                      return (
                        <button
                          suppressHydrationWarning
                          type="button"
                          key={variantKey}
                          onClick={() => {
                            setSelectedVariantId(variantKey);
                            setSelectedVariantAttrs({
                              capacity: attrs.capacity,
                              style: attrs.style,
                              material: attrs.material,
                              color: attrs.color,
                            });
                            setQuantity(1);
                            setActiveImage(variantImage);
                          }}
                          className={cn(
                            "grid w-full gap-3 rounded-xl border p-3 text-left transition-all sm:grid-cols-[56px_minmax(0,1fr)_120px] sm:items-center",
                            isActive
                              ? "border-[#3BB77E] bg-[#F0FBF6] shadow-sm"
                              : "border-[#E2EDE8] bg-white hover:border-[#3BB77E]/60 hover:bg-[#F8FBFA]",
                          )}
                        >
                          <span className="block size-14 overflow-hidden rounded-xl border border-[#E2EDE8] bg-white">
                            <img
                              src={variantImage}
                              alt={variantName}
                              className="h-full w-full object-contain p-1.5"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="inline-flex items-center gap-2 align-middle">
                              <span className="truncate text-sm font-black text-[#253D4E]">
                                {variantName}
                              </span>
                              {stock > 0 ? (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-[#3BB77E]">
                                  Còn {stock.toLocaleString("vi-VN")} {product.unit}
                                </span>
                              ) : (
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                                  Hết hàng
                                </span>
                              )}
                            </span>
                            {rows.length > 0 ? (
                              <span className="ml-2 inline-flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-0.5 align-middle [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {rows.map((row) => (
                                  <span
                                    key={`${variantKey}-${row.label}-${row.value}`}
                                    className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-600"
                                  >
                                    {row.label}: {row.value}
                                  </span>
                                ))}
                              </span>
                            ) : null}
                          </span>
                          <span className="text-sm font-black text-[#3BB77E] sm:text-right">
                            {formatCurrency(variant.price || 0)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : sizes.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Trọng lượng / Dung tích
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {sizes.map((size) => {
                      const isActive = size === selectedSize;
                      return (
                        <button
                          suppressHydrationWarning
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "text-xs font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center",
                            isActive
                              ? "bg-[#3BB77E] border-[#3BB77E] text-white shadow-xs"
                              : "bg-[#F2F3F4] dark:bg-zinc-800 border-[#F2F3F4] dark:border-zinc-800 text-[#7E7E7E] dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          )}
                        >
                          <span>{size}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Actions: Quantity Selector & Add Button + Design Button side by side */}
            <div className="mt-6 flex flex-wrap items-center gap-3 pb-4">
              {/* Custom Spin quantity box */}
              <div className={cn(
                "flex items-center border border-[#E2EDE8] dark:border-zinc-700 rounded-lg overflow-hidden h-11 w-20 bg-white dark:bg-zinc-800 shrink-0",
                isVariantSelectionBlocked && "opacity-50 pointer-events-none"
              )}>
                <input
                  suppressHydrationWarning
                  type="number"
                  min={1}
                  max={activeStock}
                  aria-label="Số lượng"
                  disabled={isVariantSelectionBlocked}
                  className="w-full text-center outline-none text-sm font-bold bg-transparent border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={isVariantSelectionBlocked ? 0 : quantity}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    if (!isNaN(parsed) && parsed >= 1) {
                      setQuantity(Math.min(activeStock, parsed));
                    }
                  }}
                />
                <div className="flex flex-col border-l border-[#E2EDE8] dark:border-zinc-700 h-full justify-between w-6">
                  <button
                    suppressHydrationWarning
                    disabled={isVariantSelectionBlocked || quantity >= activeStock}
                    className="px-1 text-[8px] hover:bg-zinc-100 dark:hover:bg-zinc-700 flex-1 border-b border-[#E2EDE8] dark:border-zinc-700 flex items-center justify-center cursor-pointer border-0 bg-transparent font-extrabold disabled:opacity-40"
                    onClick={() => setQuantity((q) => Math.min(activeStock, q + 1))}
                  >
                    ▲
                  </button>
                  <button
                    suppressHydrationWarning
                    disabled={isVariantSelectionBlocked || quantity <= 1}
                    className="px-1 text-[8px] hover:bg-zinc-100 dark:hover:bg-zinc-700 flex-1 flex items-center justify-center cursor-pointer border-0 bg-transparent font-extrabold disabled:opacity-40"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="flex-1 min-w-[140px]">
                <AddToCartButton
                  className="h-11 w-full bg-[#3BB77E] hover:bg-[#2f9565] text-white font-bold rounded-lg flex items-center justify-center gap-2 border-0 cursor-pointer text-sm shadow-none"
                  product={activeProductToAddToCart!}
                  quantity={isVariantSelectionBlocked ? 0 : quantity}
                  selectedSize={activeLabel}
                  attributes={selectedVariant?.attributes}
                  disabled={isVariantSelectionBlocked || !activeProductToAddToCart}
                />
              </div>

              {/* Nút Thiết kế ly này, chỉ dành cho ly chưa in */}
              {canBeCustomDesigned && (
                <div className="shrink-0">
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 px-4 border-primary/40 bg-emerald-50 hover:bg-emerald-100/80 text-primary font-bold rounded-lg flex items-center justify-center gap-1.5 text-xs shadow-none transition-all cursor-pointer"
                  >
                    <Link
                      href={designCupHref}
                    >
                      <Paintbrush className="size-3.5 text-primary shrink-0" />
                      <span>Thiết kế</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Banner hết hàng */}
            {showCupOutOfStockBanner && (
              <div className="mb-4 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-in fade-in duration-200">
                <span className="text-base">⚠️</span>
                <span>Dung tích <strong>{activeLabel}</strong> hiện đang hết hàng. Vui lòng chọn dung tích khác hoặc tạo mẫu trước.</span>
              </div>
            )}

            {/* Meta tags detail list */}
            <div className="hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-500">Phân loại:</span>
                <span className="text-[#3BB77E] font-bold hover:underline cursor-pointer">
                  {categoryLabel}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-500">Mã hàng:</span>
                <span className="text-[#3BB77E] font-bold hover:underline cursor-pointer">
                  {activeSku}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-500">Nhà cung cấp:</span>
                <span className="text-gray-700 dark:text-zinc-200 font-bold">
                  {getVendorName(product)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-500">Tồn kho:</span>
                <span className={cn("font-bold", displayStock <= 0 ? "text-rose-600" : "text-[#3BB77E]")}>
                  {displayStock <= 0 ? "Hết hàng" : `${displayStock.toLocaleString("vi-VN")} ${product.unit}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TABBED DETAIL CONTENT SECTION */}
        <div className="hidden">
          {/* Tab buttons menu */}
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 pb-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              suppressHydrationWarning
              onClick={() => setActiveTab("desc")}
              className={cn(
                "px-5 py-2.5 text-xs md:text-sm font-extrabold rounded-full transition-all border cursor-pointer",
                activeTab === "desc"
                  ? "bg-[#DEF9EC] text-[#3BB77E] border-[#BCE3C9]"
                  : "bg-transparent text-muted-foreground border-transparent hover:text-[#3BB77E] hover:border-gray-200"
              )}
            >
              Mô tả sản phẩm
            </button>
            <button
              suppressHydrationWarning
              onClick={() => setActiveTab("specs")}
              className={cn(
                "px-5 py-2.5 text-xs md:text-sm font-extrabold rounded-full transition-all border cursor-pointer",
                activeTab === "specs"
                  ? "bg-[#DEF9EC] text-[#3BB77E] border-[#BCE3C9]"
                  : "bg-transparent text-muted-foreground border-transparent hover:text-[#3BB77E] hover:border-gray-200"
              )}
            >
              Thông số chi tiết
            </button>
            <button
              suppressHydrationWarning
              onClick={() => setActiveTab("vendor")}
              className={cn(
                "px-5 py-2.5 text-xs md:text-sm font-extrabold rounded-full transition-all border cursor-pointer",
                activeTab === "vendor"
                  ? "bg-[#DEF9EC] text-[#3BB77E] border-[#BCE3C9]"
                  : "bg-transparent text-muted-foreground border-transparent hover:text-[#3BB77E] hover:border-gray-200"
              )}
            >
              Nhà cung cấp
            </button>
          </div>

          {/* Active Tab Content Display */}
          <div className="pt-6">
            {activeTab === "desc" && (
              <div className="text-xs md:text-sm text-muted-foreground dark:text-zinc-300 leading-relaxed">
                {product.description ? (
                  <div
                    className="prose prose-sm max-w-none prose-headings:text-[#253D4E] prose-headings:font-extrabold prose-a:text-[#3BB77E] prose-li:marker:text-[#3BB77E]"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-slate-400 italic text-xs">Sản phẩm này chưa có mô tả.</p>
                )}
              </div>
            )}

            {activeTab === "specs" && (
              <div className="space-y-4">
                <h4 className="font-extrabold text-[#253D4E] dark:text-zinc-200 text-sm">
                  Thông số chi tiết sản phẩm
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 text-xs md:text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-gray-500 font-semibold">Mã sản phẩm (SKU)</span>
                    <span className="font-bold text-[#253D4E] dark:text-zinc-200">{product.productRefId}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-gray-500 font-semibold">Đơn vị tính</span>
                    <span className="font-bold text-[#253D4E] dark:text-zinc-200">{product.unit}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-gray-500 font-semibold">Phân loại</span>
                    <span className="font-bold text-[#253D4E] dark:text-zinc-200">{categoryCopy[product.category]}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-gray-500 font-semibold">Loại vận hành</span>
                    <span className="font-bold text-[#253D4E] dark:text-zinc-200">{product.fulfillmentType ?? "STANDARD"}</span>
                  </div>
                </div>
                {allVariantAttributeGroups.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                      Thuộc tính biến thể
                    </h5>
                    <div className="space-y-3">
                      {allVariantAttributeGroups.map((variant) => (
                        <div
                          key={variant.id}
                          className="grid gap-3 rounded-xl border border-[#E2EDE8] bg-[#F8FBFA] p-3 sm:grid-cols-[88px_1fr]"
                        >
                          <div className="size-20 overflow-hidden rounded-xl border border-[#E2EDE8] bg-white">
                            <img
                              src={variant.image}
                              alt={variant.sku}
                              className="h-full w-full object-contain p-2"
                            />
                          </div>
                          <div className="min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2EDE8] pb-2">
                            <span className="text-xs font-black text-[#253D4E]">
                              {variant.sku}
                            </span>
                            <span className="text-xs font-bold text-[#3BB77E]">
                              {formatCurrency(variant.price || 0)}
                              {" · "}
                              {(variant.availableQty ?? 0).toLocaleString("vi-VN")} {product!.unit}
                            </span>
                          </div>
                          {variant.rows.length > 0 ? (
                            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                              {variant.rows.map((attr) => (
                                <div key={`${variant.id}-${attr.label}-${attr.value}`} className="min-w-0">
                                  <div className="text-[10px] font-bold uppercase text-muted-foreground">
                                    {attr.label}
                                  </div>
                                  <div className="mt-1 break-words text-xs font-extrabold text-[#253D4E]">
                                    {attr.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "vendor" && (
              <div className="space-y-4 text-xs md:text-sm text-muted-foreground dark:text-zinc-300 leading-relaxed">
                {getVendorName(product) ? (
                  <h4 className="font-extrabold text-[#253D4E] dark:text-zinc-200 text-sm">
                    Thông tin nhà cung cấp: {getVendorName(product)}
                  </h4>
                ) : (
                  <p className="text-slate-400 italic text-xs">Chưa có thông tin nhà cung cấp từ DB.</p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  );
}

