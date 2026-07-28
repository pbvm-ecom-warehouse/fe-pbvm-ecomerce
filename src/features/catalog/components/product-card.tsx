"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Paintbrush, Plus, ShoppingCart, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCatalogProductBySlug } from "@/features/catalog/services/catalog.service";
import {
  coerceVariantAttributes,
  normalizeVariantAttributes,
} from "@/features/catalog/utils/variant-attributes";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { CatalogProduct, ProductVariant } from "@/types/api";
import { formatCurrency } from "@/utils/format-currency";

const categoryCopy: Record<string, string> = {
  ingredient: "Nguyên liệu",
  plain_cup: "Ly chưa in",
  printed_cup: "Ly đã in",
  custom_print: "Ly in theo yêu cầu",
};

function getVendorName(product: CatalogProduct) {
  return (
    (product as any).vendorName ||
    (product as any).supplierName ||
    (product as any).brandName ||
    ""
  );
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase();
}

function getProductKind(product: CatalogProduct): "cup" | "ingredient" | "packaging" | "generic" {
  const source = normalizeText(
    [
      product.category,
      product.categoryName,
      (product as any).categoryObj?.slug,
      (product as any).categoryObj?.name,
      product.slug,
      product.name,
    ]
      .filter(Boolean)
      .join(" "),
  );

  if (
    source.includes("bao bi") ||
    source.includes("packaging") ||
    source.includes("hop") ||
    source.includes("tui") ||
    source.includes("nap")
  ) {
    return "packaging";
  }
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

function prettifyAttributeKey(key: string) {
  return key
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getAttributeLabel(key: string, kind: ReturnType<typeof getProductKind>) {
  const normalizedKey = normalizeText(key).replace(/[^a-z0-9]+/g, "");
  const common: Record<string, string> = {
    color: "Màu sắc",
    mau: "Màu sắc",
    mausac: "Màu sắc",
    brand: "Thương hiệu",
    thuonghieu: "Thương hiệu",
    origin: "Xuất xứ",
    xuatxu: "Xuất xứ",
  };
  const cup: Record<string, string> = {
    capacity: "Dung tích",
    size: "Dung tích",
    spec: "Dung tích",
    dungtich: "Dung tích",
    material: "Chất liệu",
    chatlieu: "Chất liệu",
    style: "Kiểu dáng",
    cupstyle: "Kiểu dáng",
    kieudang: "Kiểu dáng",
  };
  const ingredient: Record<string, string> = {
    capacity: "Quy cách",
    size: "Khối lượng",
    spec: "Quy cách",
    weight: "Khối lượng",
    khoiluong: "Khối lượng",
    flavor: "Hương vị",
    huongvi: "Hương vị",
    material: "Thành phần",
    thanhphan: "Thành phần",
  };
  const packaging: Record<string, string> = {
    capacity: "Dung tích",
    size: "Kích thước",
    spec: "Kích thước",
    kichthuoc: "Kích thước",
    material: "Chất liệu",
    chatlieu: "Chất liệu",
    style: "Kiểu dáng",
    kieudang: "Kiểu dáng",
    thickness: "Độ dày",
    doday: "Độ dày",
  };

  if (kind === "ingredient") return ingredient[normalizedKey] || common[normalizedKey] || prettifyAttributeKey(key);
  if (kind === "packaging") return packaging[normalizedKey] || common[normalizedKey] || prettifyAttributeKey(key);
  if (kind === "cup") return cup[normalizedKey] || common[normalizedKey] || prettifyAttributeKey(key);
  return common[normalizedKey] || cup[normalizedKey] || ingredient[normalizedKey] || packaging[normalizedKey] || prettifyAttributeKey(key);
}

function canonicalAttributeKey(key: string, kind: ReturnType<typeof getProductKind>) {
  const normalizedKey = normalizeText(key).replace(/[^a-z0-9]+/g, "");
  const aliases: Record<string, string> = {
    capacity: "capacity",
    size: kind === "ingredient" ? "weight" : kind === "packaging" ? "size" : "capacity",
    spec: kind === "ingredient" ? "spec" : kind === "packaging" ? "size" : "capacity",
    volume: "capacity",
    dungtich: "capacity",
    kichthuoc: "size",
    weight: "weight",
    khoiluong: "weight",
    flavor: "flavor",
    huongvi: "flavor",
    material: "material",
    chatlieu: "material",
    materialtype: "material",
    thanhphan: "material",
    style: "style",
    cupstyle: "style",
    shape: "style",
    kieudang: "style",
    dang: "style",
    color: "color",
    colour: "color",
    mau: "color",
    mausac: "color",
    shade: "color",
    thickness: "thickness",
    doday: "thickness",
    brand: "brand",
    thuonghieu: "brand",
    origin: "origin",
    xuatxu: "origin",
  };
  return aliases[normalizedKey] || normalizedKey || key;
}

function allowedOptionKeys(kind: ReturnType<typeof getProductKind>) {
  if (kind === "cup") return ["capacity", "style", "material", "color"];
  if (kind === "ingredient") return ["weight", "flavor", "spec", "material", "brand", "origin"];
  if (kind === "packaging") return ["size", "capacity", "style", "material", "color", "thickness"];
  return ["capacity", "size", "weight", "style", "material", "color", "flavor", "spec", "thickness"];
}

function getVariantAttrs(variant: ProductVariant): Record<string, string> {
  const rawAttrs = coerceVariantAttributes(variant.attributes);
  return {
    ...rawAttrs,
    ...normalizeVariantAttributes(rawAttrs, variant.sku),
  };
}

function getCanonicalVariantAttrs(
  variant: ProductVariant,
  kind: ReturnType<typeof getProductKind>,
) {
  const allowedKeys = allowedOptionKeys(kind);
  return Object.entries(getVariantAttrs(variant)).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      const cleanValue = String(value || "").trim();
      if (!cleanValue) return acc;
      const canonicalKey = canonicalAttributeKey(key, kind);
      if (!allowedKeys.includes(canonicalKey)) return acc;
      acc[canonicalKey] = cleanValue;
      return acc;
    },
    {},
  );
}

function buildOptionGroups(product: CatalogProduct) {
  const variants = (product.variants || []).filter((variant) => variant.isActive !== false);
  const kind = getProductKind(product);
  const allowedKeys = allowedOptionKeys(kind);
  const valuesByKey = new Map<string, Set<string>>();

  variants.forEach((variant) => {
    const attrs = getCanonicalVariantAttrs(variant, kind);
    Object.entries(attrs).forEach(([key, value]) => {
      const cleanValue = String(value || "").trim();
      if (!cleanValue) return;
      if (!valuesByKey.has(key)) valuesByKey.set(key, new Set());
      valuesByKey.get(key)!.add(cleanValue);
    });
  });

  return allowedKeys
    .filter((key) => valuesByKey.has(key))
    .map((key) => ({
      key,
      label: getAttributeLabel(key, kind),
      values: Array.from(valuesByKey.get(key) || []),
    }))
    .filter((group) => group.values.length > 0);
}

export function ProductCard({
  product: initialProduct,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const [product, setProduct] = useState<CatalogProduct>(initialProduct);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [optionProduct, setOptionProduct] = useState<CatalogProduct>(initialProduct);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(0);
  const addProduct = useCartStore((state) => state.addProduct);

  useEffect(() => {
    setProduct(initialProduct);
    setOptionProduct(initialProduct);
    setImgLoaded(false);
  }, [initialProduct]);

  const imageSrc = product.imageUrl;
  const isCustomPrint =
    product.fulfillmentType === "CUSTOM_PRINT" &&
    product.category !== "printed_cup" &&
    !(product as any).isPrinted;

  const totalStock = product.variants
    ? product.variants.reduce((s, v) => s + (v.availableQty ?? 0), 0)
    : product.stockSnapshot ?? 0;

  const hasDiscount = product.b2bPrice > 0 && product.price > product.b2bPrice;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.b2bPrice) / product.price) * 100)
    : 0;

  const catLabel = product.categoryName || categoryCopy[product.category] || product.category || "";
  const vendorName = getVendorName(product);
  const optionProductKind = useMemo(() => getProductKind(optionProduct), [optionProduct]);
  const optionGroups = useMemo(() => buildOptionGroups(optionProduct), [optionProduct]);
  const selectedVariant = useMemo(() => {
    const variants = (optionProduct.variants || []).filter((variant) => variant.isActive !== false);
    if (variants.length === 0) return null;
    if (optionGroups.length === 0) {
      return variants.find((variant) => (variant.availableQty ?? 0) > 0) || variants[0];
    }
    const hasAllOptions = optionGroups.every((group) => selectedOptions[group.key]);
    if (!hasAllOptions) return null;
    return (
      variants.find((variant) => {
        const attrs = getCanonicalVariantAttrs(variant, optionProductKind);
        return optionGroups.every((group) => attrs[group.key] === selectedOptions[group.key]);
      }) || null
    );
  }, [optionGroups, optionProduct, optionProductKind, selectedOptions]);

  const canAddSelectedVariant = Boolean(selectedVariant && (selectedVariant.availableQty ?? 0) > 0);
  const selectedVariantStock = selectedVariant?.availableQty ?? 0;

  useEffect(() => {
    if (!selectedVariant) {
      setQuantity(0);
      return;
    }
    setQuantity((current) => {
      if (selectedVariantStock <= 0) return 0;
      if (current <= 0) return 1;
      return Math.min(current, selectedVariantStock);
    });
  }, [selectedVariant, selectedVariantStock]);

  async function openOptionModal() {
    setOptionsOpen(true);
    setLoadingOptions(true);
    setQuantity(0);
    setSelectedOptions({});
    setOptionProduct(product);
    try {
      const freshProduct = await getCatalogProductBySlug(product.slug);
      if (freshProduct) setOptionProduct(freshProduct);
    } finally {
      setLoadingOptions(false);
    }
  }

  function handleAddSelectedVariant() {
    if (!selectedVariant || !canAddSelectedVariant || quantity <= 0) return;
    const attrs = getCanonicalVariantAttrs(selectedVariant, optionProductKind);
    const productForCart: CatalogProduct = {
      ...optionProduct,
      productRefId: selectedVariant.sku,
      price: selectedVariant.price,
      b2bPrice: selectedVariant.price,
      stockSnapshot: selectedVariant.availableQty,
      fulfillmentType: selectedVariant.fulfillmentType || optionProduct.fulfillmentType || "STANDARD",
    };

    addProduct(productForCart, quantity, {
      selectedSize: attrs.capacity || attrs.size,
      selectedMaterial: attrs.material,
      selectedStyle: attrs.style,
      attributes: selectedOptions,
    });
    toast.success("Đã thêm vào giỏ hàng");
    setOptionsOpen(false);
  }

  return (
    <>
      <article className="group relative flex h-full flex-col rounded-[22px] bg-white/60 p-1.5 shadow-[0_2px_20px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.06] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1.5 hover:shadow-[0_12px_40px_rgba(59,183,126,0.14),0_2px_8px_rgba(0,0,0,0.06)] hover:ring-[#BCE3C9]">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[16px] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
          {hasDiscount && (
            <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-rose-500 px-2.5 py-1 text-[10px] font-black text-white shadow-md shadow-rose-400/30">
              <Zap className="size-2.5" strokeWidth={3} />
              -{discountPct}%
            </div>
          )}

          <Link href={`/products/${encodeURIComponent(product.slug)}`} className="block">
            <div className="relative aspect-square w-full overflow-hidden rounded-[14px] bg-[#F7FAF8]">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={product.name}
                  fill
                  priority={priority}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  onLoad={() => setImgLoaded(true)}
                  className={cn(
                    "object-contain p-5 mix-blend-multiply transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.06]",
                    imgLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm",
                  )}
                />
              ) : null}
            </div>
          </Link>

          <div className="flex flex-1 flex-col gap-1.5 p-4 pt-3">
            {catLabel ? (
              <span className="text-[9.5px] font-black uppercase tracking-[0.14em] text-[#3BB77E]/70">
                {catLabel}
              </span>
            ) : null}

            <h3 className="line-clamp-2 min-h-[36px] text-[13px] font-black leading-snug tracking-tight text-[#1A2E26]">
              <Link
                href={`/products/${encodeURIComponent(product.slug)}`}
                className="transition-colors duration-300 hover:text-[#3BB77E]"
              >
                {product.name}
              </Link>
            </h3>

            {vendorName ? (
              <p className="text-[10.5px] font-medium text-slate-400">
                bởi <span className="font-bold text-[#3BB77E]/90">{vendorName}</span>
              </p>
            ) : null}

            <div className="my-1 h-px w-full bg-gradient-to-r from-transparent via-[#E2EDE8] to-transparent" />

            <div className="flex items-end justify-between gap-2">
              <div className="flex flex-col">
                {product.variants && product.variants.length > 0 && (
                  <span className="mb-0.5 text-[9px] font-extrabold uppercase leading-none tracking-widest text-[#3BB77E]/60">
                    Giá từ
                  </span>
                )}
                <span className="text-[17px] font-black leading-none text-[#1A2E26]">
                  {formatCurrency(product.b2bPrice || product.price)}
                </span>
                {hasDiscount && (
                  <span className="mt-0.5 text-[11px] leading-none text-slate-400 line-through">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>

              <div className="shrink-0">
                {isCustomPrint ? (
                  <Button
                    asChild
                    className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border-0 bg-[#DEF9EC] px-3.5 text-xs font-bold text-[#3BB77E] shadow-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#3BB77E] hover:text-white active:scale-[0.96]"
                  >
                    <Link href={`/design-cup?productId=${product.id}`}>
                      <Paintbrush className="size-3.5" />
                      Thiết kế
                    </Link>
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={openOptionModal}
                    disabled={totalStock <= 0}
                    className="h-9 cursor-pointer rounded-xl border-0 bg-[#DEF9EC] px-3.5 text-xs font-bold text-[#3BB77E] shadow-none transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#3BB77E] hover:text-white active:scale-[0.96]"
                  >
                    <ShoppingCart className="mr-1 size-3.5" />
                    {totalStock <= 0 ? "Hết hàng" : "Thêm"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      <Dialog open={optionsOpen} onOpenChange={setOptionsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chọn thông số sản phẩm</DialogTitle>
            <DialogDescription>{optionProduct.name}</DialogDescription>
          </DialogHeader>

          {loadingOptions && optionGroups.length === 0 ? null : optionGroups.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              Sản phẩm này chưa có thông số biến thể từ API.
            </div>
          ) : (
            <div className="space-y-4">
              {optionGroups.map((group) => (
                <div key={group.key} className="space-y-2">
                  <div className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    {group.label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {group.values.map((value) => {
                      const selected = selectedOptions[group.key] === value;
                      return (
                        <Button
                          key={value}
                          type="button"
                          variant={selected ? "default" : "outline"}
                          className={cn(
                            "h-9 rounded-lg px-3 text-xs font-bold",
                            selected && "bg-[#3BB77E] text-white hover:bg-[#2fa66f]",
                          )}
                          onClick={() =>
                            setSelectedOptions((current) => ({
                              ...current,
                              [group.key]: value,
                            }))
                          }
                        >
                          {value}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <span className="text-sm font-bold text-slate-700">Số lượng</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label="Giảm số lượng"
                    onClick={() => setQuantity((value) => Math.max(0, value - 1))}
                    disabled={quantity <= 0}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="min-w-8 text-center text-sm font-black">{quantity}</span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    aria-label="Tăng số lượng"
                    onClick={() =>
                      setQuantity((value) =>
                        Math.min(selectedVariantStock, value + 1),
                      )
                    }
                    disabled={!selectedVariant || selectedVariantStock <= 0 || quantity >= selectedVariantStock}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
              </div>

              {selectedVariant ? (
                <div className="flex items-center justify-between rounded-lg border bg-white p-3 text-sm">
                  <span className="font-medium text-muted-foreground">SKU: {selectedVariant.sku}</span>
                  <span className="font-black text-[#1A2E26]">{formatCurrency(selectedVariant.price)}</span>
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              className="bg-[#3BB77E] font-bold text-white hover:bg-[#2fa66f]"
              disabled={loadingOptions || !canAddSelectedVariant || quantity <= 0}
              onClick={handleAddSelectedVariant}
            >
              <ShoppingCart className="mr-1 size-4" />
              Thêm vào giỏ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
