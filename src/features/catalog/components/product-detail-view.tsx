"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import { subscribeProductSync } from "@/features/catalog/services/admin-catalog.service";
import { mapProductDetail } from "@/features/catalog/services/catalog.service";
import {
  Award,
  BadgePercent,
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
  Sparkles,
  Star,
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

const categoryCopy: Record<CatalogProduct["category"], string> = {
  ingredient: "Nguyên liệu",
  plain_cup: "Ly chưa in",
  printed_cup: "Ly đã in",
  custom_print: "Ly in theo yêu cầu",
};

function getVendorName(product: CatalogProduct | null) {
  if (!product) return "PBVM Supplier";
  if (product.slug.includes("kievit")) return "Kievit Indo";
  if (product.slug.includes("tra-den") || product.slug.includes("phuc-long")) return "Phúc Long";
  if (product.slug.includes("gia-uy")) return "Gia Uy";
  if (product.slug.includes("maulin")) return "Maulin";
  if (product.slug.includes("ly-nhua") || product.slug.includes("pet") || product.slug.includes("pp")) return "PBVM Plastic";
  return "PBVM Supplier";
}

function getProductImages(product: CatalogProduct | null): string[] {
  if (!product) return ["/images/product-placeholder.svg"];
  const mainImage = product.imageUrl || "/images/product-placeholder.svg";
  return [mainImage];
}

function getProductSizes(product: CatalogProduct | null): string[] {
  if (!product) return [];
  if (product.variants && product.variants.length > 0) {
    const extracted = product.variants
      .map((v) => {
        const sizeAttr =
          v.attributes?.size ||
          v.attributes?.capacity ||
          v.attributes?.["dung tích"];
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

  // Parse size from product name if specified
  const text = `${product.name} ${product.slug}`.toLowerCase();
  if (text.includes("1000ml") || text.includes("1000 ml")) return ["1000ml"];
  if (text.includes("700ml") || text.includes("750ml") || text.includes("700 ml")) return ["700ml"];
  if (text.includes("500ml") || text.includes("500 ml")) return ["500ml"];
  if (text.includes("350ml") || text.includes("350 ml")) return ["350ml"];

  const nameLower = product.name.toLowerCase();
  if (
    product.category === "printed_cup" ||
    product.category === "plain_cup" ||
    product.category === "custom_print" ||
    product.slug.includes("ly-") ||
    nameLower.includes("ly nhựa") ||
    nameLower.includes("ly giấy") ||
    nameLower.startsWith("ly ")
  ) {
    return ["350ml", "500ml", "700ml", "1000ml"];
  }

  const unit = product.unit.toLowerCase();
  if (unit.includes("bao") || unit.includes("túi") || unit.includes("kg")) {
    if (product.slug.includes("kievit")) {
      return ["1kg", "5kg", "25kg"];
    }
    return ["500g", "1kg", "2kg", "3kg", "5kg"];
  }

  return ["Chai 1L", "Can 2.5kg", "Thùng"];
}

function getVariantLabel(v: ProductVariant): string {
  const attrSize =
    v.attributes?.size ||
    v.attributes?.capacity ||
    v.attributes?.["dung tích"] ||
    v.attributes?.material ||
    v.attributes?.style;
  if (attrSize) return attrSize;

  const sku = (v.sku || "").toUpperCase();
  if (sku.includes("1000ML")) return "1000ml";
  if (sku.includes("700ML") || sku.includes("750ML")) return "700ml";
  if (sku.includes("500ML")) return "500ml";
  if (sku.includes("350ML")) return "350ml";
  if (sku.includes("DEFAULT")) return "Ly tiêu chuẩn";
  if (sku.includes("PRINTED") || v.fulfillmentType === "CUSTOM_PRINT")
    return "In logo theo yêu cầu";

  return v.sku;
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
    const syncOverride = () => {
      if (typeof window === "undefined") return;
      try {
        let baseProduct = initialProduct;

        // Fallback check local drafts/overrides if server returned null
        if (!baseProduct && targetSlug) {
          const decoded = decodeURIComponent(targetSlug);
          const hyphenated = decoded.trim().toLowerCase().replace(/\s+/g, "-");
          const drafts = JSON.parse(localStorage.getItem("ecom_local_drafts") || "[]");
          const foundDraft = drafts.find(
            (d: any) =>
              d.slug === decoded ||
              d.slug === hyphenated ||
              d.id === decoded ||
              d._id === decoded ||
              (d.name && d.name.toLowerCase().trim().replace(/\s+/g, "-") === hyphenated)
          );
          if (foundDraft) {
            baseProduct = mapProductDetail(foundDraft);
          } else {
            const overrides = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
            const foundOv: any =
              overrides[decoded] ||
              overrides[hyphenated] ||
              Object.values(overrides).find((item: any) => {
                if (!item) return false;
                const itemSlug = String(item.slug || "").toLowerCase();
                const itemName = String(item.name || "").toLowerCase().trim().replace(/\s+/g, "-");
                return itemSlug === decoded.toLowerCase() || itemSlug === hyphenated || itemName === hyphenated;
              });
            if (foundOv) {
              baseProduct = mapProductDetail(foundOv);
            }
          }
        }

        if (!baseProduct) {
          setProduct(null);
          return;
        }

        const overrides = JSON.parse(localStorage.getItem("ecom_local_overrides") || "{}");
        const pId = baseProduct.id;
        const pSlug = baseProduct.slug;
        const pRef = baseProduct.productRefId;
        const pNameKey = baseProduct.name ? baseProduct.name.toLowerCase().trim().replace(/\s+/g, "-") : "";

        let ov: any =
          (pId ? overrides[pId] : null) ||
          (pSlug ? overrides[pSlug] : null) ||
          (pRef ? overrides[pRef] : null) ||
          (pNameKey ? overrides[pNameKey] : null);

        if (!ov && typeof overrides === "object") {
          ov = Object.values(overrides).find((item: any) => {
            if (!item) return false;
            const itemSlug = String(item.slug || "").toLowerCase();
            const itemName = String(item.name || "").toLowerCase().trim().replace(/\s+/g, "-");
            const itemId = String(item.id || item._id || "");
            return (
              (pSlug && itemSlug === pSlug.toLowerCase()) ||
              (pNameKey && itemName === pNameKey) ||
              (pId && itemId === pId)
            );
          });
        }

        if (ov) {
          const newImg = (ov.images && ov.images[0]) || ov.imageUrl;
          const newName = ov.name || baseProduct.name;

          const beVariants = baseProduct.variants && baseProduct.variants.length > 0
            ? baseProduct.variants
            : null;
          const newVariants = beVariants ?? ov.variants ?? [];

          const validVariantPrices = newVariants
            .map((v: any) => Number(v.price))
            .filter((pr: number) => !isNaN(pr) && pr > 0);

          const minVariantPrice = validVariantPrices.length > 0
            ? Math.min(...validVariantPrices)
            : (baseProduct.price ?? ov.price);

          setProduct({
            ...baseProduct,
            name: newName,
            imageUrl: newImg || baseProduct.imageUrl,
            images: ov.images || baseProduct.images || (newImg ? [newImg] : baseProduct.images),
            price: minVariantPrice,
            b2bPrice: minVariantPrice,
            variants: newVariants,
          });
        } else {
          setProduct(baseProduct);
        }
      } catch (e) {
        console.error("ProductDetailView override error:", e);
      }
    };

    syncOverride();
    const unsubscribe = subscribeProductSync(syncOverride);
    return () => {
      unsubscribe();
    };
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
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "vendor" | "reviews">("desc");

  const selectedVariant = useMemo(() => {
    if (!product || !hasVariants || !product.variants || product.variants.length === 0) return null;
    return product.variants[selectedVariantIndex] ?? product.variants[0];
  }, [product, hasVariants, selectedVariantIndex]);

  const activePrice = selectedVariant ? selectedVariant.price : ((product?.b2bPrice || product?.price) ?? 0);
  const hasSalePrice = Boolean(product && product.price > activePrice);
  const discountPercent = hasSalePrice && product
    ? Math.round(((product.price - activePrice) / product.price) * 100)
    : 0;

  const isCustomPrint = selectedVariant
    ? selectedVariant.fulfillmentType === "CUSTOM_PRINT"
    : product?.fulfillmentType === "CUSTOM_PRINT";

  const activeStock = selectedVariant ? (selectedVariant.availableQty ?? 0) : (product?.stockSnapshot ?? 0);
  const isSelectedVariantOutOfStock = activeStock <= 0;

  const activeLabel = selectedVariant
    ? getVariantLabel(selectedVariant)
    : (selectedSize || "Tiêu chuẩn");

  const activeProductToAddToCart = useMemo(() => {
    if (!product) return null;
    if (!selectedVariant) return product;
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

  const categoryLabel = useMemo(() => {
    if (!product) return "";
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

  const activeSku = selectedVariant?.sku || product.productRefId;
  const displayStock = selectedVariant ? selectedVariant.availableQty : product.stockSnapshot;

  return (
    <main className="min-h-screen bg-white text-foreground">
      {/* ── BREADCRUMB ── */}
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
        {/* ── PRODUCT GRID (Split 2 Columns) ── */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* LEFT: Image Gallery (5 columns on desktop) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Big Main Image Container */}
            <div className="relative aspect-square w-full rounded-2xl border border-[#E2EDE8] bg-white flex items-center justify-center p-6 shadow-sm overflow-hidden group">
              <div className="relative w-full h-full">
                <Image
                  src={activeImage}
                  alt={product.name}
                  fill
                  priority
                  className="object-contain transition-transform duration-300 group-hover:scale-105 mix-blend-multiply dark:mix-blend-normal"
                />
              </div>

              {/* Absolute search zoom icon */}
              <button suppressHydrationWarning className="absolute right-4 top-4 size-8 flex items-center justify-center rounded-full bg-white border border-[#E2EDE8] text-gray-400 hover:text-[#3BB77E] shadow-sm active:scale-95 transition-all">
                <Search className="size-4" />
              </button>
            </div>

            {/* Thumbnail Row */}
            <div className="flex items-center gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
              {images.map((img, idx) => {
                const isActive = img === activeImage;
                return (
                  <button
                    suppressHydrationWarning
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "relative aspect-square size-16 rounded-xl border bg-white flex items-center justify-center p-1.5 transition-all shrink-0 cursor-pointer overflow-hidden",
                      isActive
                        ? "border-[#3BB77E] ring-2 ring-[#DEF9EC]"
                        : "border-[#E2EDE8] hover:border-[#3BB77E]/50"
                    )}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Product Info Details (7 columns on desktop) */}
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

            {/* Summary description paragraph */}
            <p className="text-xs md:text-sm text-muted-foreground dark:text-zinc-300 leading-relaxed mt-4 max-w-xl">
              {product.category === "ingredient" ? (
                "Nguyên liệu pha chế trà sữa chuyên nghiệp cho chuỗi F&B. Đảm bảo nguồn gốc xuất xứ rõ ràng, hương vị béo ngậy đậm đà nguyên bản và được đóng gói trực tiếp từ lô hàng xuất kho WMS đồng bộ."
              ) : (
                "Bao bì ly cốc nhựa in thương hiệu độc quyền với kiểu dáng đa dạng (nắp phẳng, nắp cầu, nút tim). Hỗ trợ thiết kế 3D trực tuyến miễn phí và in ấn sắc nét với mực in an toàn thực phẩm."
              )}
            </p>

            {/* Sizing / Variant Row */}
            <div className="mt-6 space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {hasVariants ? "Dung tích" : "Trọng lượng / Dung tích"}
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {hasVariants && product.variants ? (
                  product.variants.map((v, idx) => {
                    const isActive = idx === selectedVariantIndex;
                    const label = getVariantLabel(v);

                    return (
                      <button
                        suppressHydrationWarning
                        key={v.id || v.sku || idx}
                        onClick={() => setSelectedVariantIndex(idx)}
                        className={cn(
                          "text-xs font-bold px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center",
                          isActive
                            ? "bg-[#3BB77E] border-[#3BB77E] text-white shadow-xs"
                            : "bg-[#F2F3F4] dark:bg-zinc-800 border-[#F2F3F4] dark:border-zinc-800 text-[#253D4E] dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        )}
                      >
                        <span>{label}</span>
                      </button>
                    );
                  })
                ) : (
                  sizes.map((size) => {
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
                  })
                )}
              </div>
            </div>

            {/* Actions: Quantity Selector & Add Button + Design Button side by side */}
            <div className="mt-6 flex flex-wrap items-center gap-3 pb-4">
              {/* Custom Spin quantity box */}
              <div className={cn(
                "flex items-center border border-[#E2EDE8] dark:border-zinc-700 rounded-lg overflow-hidden h-11 w-20 bg-white dark:bg-zinc-800 shrink-0",
                isSelectedVariantOutOfStock && "opacity-50 pointer-events-none"
              )}>
                <input
                  suppressHydrationWarning
                  type="number"
                  min={1}
                  max={activeStock}
                  aria-label="Số lượng"
                  disabled={isSelectedVariantOutOfStock}
                  className="w-full text-center outline-none text-sm font-bold bg-transparent border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={isSelectedVariantOutOfStock ? 0 : quantity}
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
                    disabled={isSelectedVariantOutOfStock || quantity >= activeStock}
                    className="px-1 text-[8px] hover:bg-zinc-100 dark:hover:bg-zinc-700 flex-1 border-b border-[#E2EDE8] dark:border-zinc-700 flex items-center justify-center cursor-pointer border-0 bg-transparent font-extrabold disabled:opacity-40"
                    onClick={() => setQuantity((q) => Math.min(activeStock, q + 1))}
                  >
                    ▲
                  </button>
                  <button
                    suppressHydrationWarning
                    disabled={isSelectedVariantOutOfStock || quantity <= 1}
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
                  quantity={isSelectedVariantOutOfStock ? 0 : quantity}
                  selectedSize={activeLabel}
                  attributes={selectedVariant?.attributes}
                  disabled={isSelectedVariantOutOfStock}
                />
              </div>

              {/* Nút Thiết kế ly này (Gọn gàng kế bên nút Thêm - Chỉ dành cho ly chưa in) */}
              {canBeCustomDesigned && (
                <div className="shrink-0">
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 px-4 border-primary/40 bg-emerald-50 hover:bg-emerald-100/80 text-primary font-bold rounded-lg flex items-center justify-center gap-1.5 text-xs shadow-none transition-all cursor-pointer"
                  >
                    <Link
                      href={`/design-cup?productId=${product.id}&size=${encodeURIComponent(activeLabel)}&materialType=${encodeURIComponent(inferredMaterial)}&style=${encodeURIComponent(inferredStyle)}`}
                    >
                      <Paintbrush className="size-3.5 text-primary shrink-0" />
                      <span>Thiết kế</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Banner hết hàng (ĐẶT Ở DƯỚI NÚT BẤM ĐỂ TRÁNH BỊ NHẢY VỊ TRÍ DÒNG NÚT BẤM) */}
            {isSelectedVariantOutOfStock && (
              <div className="mb-4 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold animate-in fade-in duration-200">
                <span className="text-base">⚠️</span>
                <span>Dung tích <strong>{activeLabel}</strong> hiện đang hết hàng. Vui lòng chọn dung tích khác hoặc tạo mẫu trước.</span>
              </div>
            )}

            {/* Meta tags detail list */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-6 text-xs text-muted-foreground border-t border-gray-100 pt-4">
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

        {/* ── TABBED DETAIL CONTENT SECTION ── */}
        <div className="mt-12 border border-[#E2EDE8] dark:border-zinc-800 rounded-[20px] p-6 md:p-8 shadow-sm">
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
              <div className="space-y-4 text-xs md:text-sm text-muted-foreground dark:text-zinc-300 leading-relaxed">
                <p>
                  Sản phẩm được tuyển chọn kỹ càng và phục vụ phân khúc chuỗi F&B chuyên nghiệp. Chúng tôi hiểu rằng bao bì ly in logo và chất lượng nguyên liệu pha chế là yếu tố tiên quyết trong sự thành bại của một cửa hàng trà sữa hay cà phê.
                </p>
                <p>
                  Đối với các sản phẩm bao bì ly nhựa PP/PET, PBVM cam kết bề mặt nhẵn mịn, độ dày đồng đều chuẩn ly cứng và bền bỉ trong quá trình bảo quản hay giao hàng. Công nghệ in offset cho phép các chi tiết in ấn chính xác, không nhòe lệch, giữ đúng tỷ lệ thiết kế logo thương hiệu của bạn.
                </p>

                <h4 className="font-extrabold text-[#253D4E] dark:text-zinc-200 text-sm pt-2">Đặc điểm nổi bật:</h4>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Nguồn gốc rõ ràng: Đầy đủ giấy tờ hải quan, kiểm định chất lượng và ATVSTP.</li>
                  <li>Tồn kho realtime: Đồng bộ trực tiếp với hệ thống phần mềm quản lý kho WMS giúp tránh tình trạng hết hàng đột xuất.</li>
                  <li>Dịch vụ in trọn gói: Nhận in ấn số lượng sỉ từ 10.000 ly với thời gian hoàn thành nhanh chóng trong vòng 5-7 ngày làm việc.</li>
                  <li>Chính sách vận chuyển: Giao sỉ qua chành xe toàn quốc hoặc hỗ trợ giao hàng nội thành cực nhanh cho các đơn hỏa tốc.</li>
                </ul>
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
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-gray-500 font-semibold">Quy cách đóng thùng</span>
                    <span className="font-bold text-[#253D4E] dark:text-zinc-200">
                      {product.category === "ingredient" ? "Đóng gói theo lô nhập kho" : "Thùng 1000 cái (20 cây x 50 ly)"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-gray-500 font-semibold">Trạng thái tồn kho</span>
                    <span className="font-bold text-[#3BB77E]">Đang sẵn hàng tại WMS</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "vendor" && (
              <div className="space-y-4 text-xs md:text-sm text-muted-foreground dark:text-zinc-300 leading-relaxed">
                <h4 className="font-extrabold text-[#253D4E] dark:text-zinc-200 text-sm">
                  Thông tin nhà cung cấp: {getVendorName(product)}
                </h4>
                <p>
                  Sản phẩm được phân phối chính thức bởi **{getVendorName(product)}** qua hệ thống B2B của PBVM Logistics. Chúng tôi là đối tác độc quyền cung cấp các dòng sản phẩm bao bì ly nhựa in ấn chất lượng cao và nguyên liệu trà sữa chính hãng sỉ trực tiếp.
                </p>
                <div className="grid gap-2 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Warehouse className="size-4 text-[#3BB77E]" />
                    <span>Kho phân phối chính: Tổng kho WMS PBVM Bình Chánh, TP.HCM</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="size-4 text-[#3BB77E]" />
                    <span>Hỗ trợ vận chuyển: Giao xe tải nội thành TP.HCM & Gửi chành xe đi các tỉnh lân cận</span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ── INFO BANNERS ── */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-xl border border-[#E2EDE8] dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#3BB77E]" />
            <div>
              <h5 className="text-xs font-bold text-[#253D4E] dark:text-zinc-200">Đồng bộ WMS realtime</h5>
              <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-400 mt-0.5">
                Mức tồn kho hiển thị trực tiếp từ kho Bình Chánh giúp các chuỗi đặt hàng không lo đứt gãy logistics.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-[#E2EDE8] dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm">
            <Truck className="mt-0.5 size-5 shrink-0 text-[#3BB77E]" />
            <div>
              <h5 className="text-xs font-bold text-[#253D4E] dark:text-zinc-200">Vận chuyển chành xe sỉ</h5>
              <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-400 mt-0.5">
                PBVM hỗ trợ liên hệ gửi xe khách, chành xe tải toàn quốc hoặc giao hỏa tốc bằng xe máy tại nội thành.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-[#E2EDE8] dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-4 shadow-sm">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-[#3BB77E]" />
            <div>
              <h5 className="text-xs font-bold text-[#253D4E] dark:text-zinc-200">Dịch vụ in logo riêng</h5>
              <p className="text-[11px] leading-relaxed text-muted-foreground dark:text-zinc-400 mt-0.5">
                Các sản phẩm in logo theo mẫu Marquett custom sẽ được hỗ trợ duyệt mô hình 3D xoay 360 độ trực tiếp.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

