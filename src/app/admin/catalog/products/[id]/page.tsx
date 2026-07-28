"use client";

import { useEffect, useState, useMemo, useTransition } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Layers,
  Tag,
  Save,
  RefreshCw,
  CheckCircle2,
  Package,
  Upload,
  Loader2,
  Trash2,
  Image as ImageIcon,
  Rocket,
  AlertCircle,
  Building2,
  Info,
  Pencil,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import {
  adminListCategories,
  adminGetProductVariants,
  adminUpdateProduct,
  adminUpdateVariant,
  adminActivateProductVariants,
  adminPublishProductWithVariants,
  adminUploadProductImage,
  adminListProducts,
} from "@/features/catalog/services/admin-catalog.service";
import { publicApiFetch } from "@/lib/public-api";
import { formatCurrency } from "@/utils/format-currency";
import type { FulfillmentType } from "@/types/api";
import {
  collectVariantAttributes,
  collectWmsItemVariantAttributes,
  normalizeVariantAttributes,
} from "@/features/catalog/utils/variant-attributes";
import { listWmsItems } from "@/features/catalog/services/wms-stock.service";

type AdminProductVariantState = {
  id?: string;
  sku: string;
  price: number;
  availableQty: number;
  attributes: Record<string, string>;
  fulfillmentType: FulfillmentType;
};

type AdminProductPageCacheEntry = {
  categories: any[];
  product: any;
  prodName: string;
  prodSlug: string;
  prodDesc: string;
  prodImage: string;
  prodCategoryId: string;
  prodVariants: AdminProductVariantState[];
};

const adminProductPageCache = new Map<string, AdminProductPageCacheEntry>();

const FULFILLMENT_LABELS: Record<string, string> = {
  STANDARD: "Hàng sẵn kho",
  PRINTED_TEMPLATE: "Ly đã in sẵn",
  CUSTOM_PRINT: "Hàng khách tự thiết kế",
};

function getProductType(product: any, sku: string = ""): "CUP" | "MATERIAL" | "PACKAGING" {
  const catStr = String(
    product?.category?.slug || product?.category || product?.categoryId || ""
  ).toLowerCase();
  const nameStr = String(product?.name || "").toLowerCase();
  const skuUpper = String(sku || product?.sku || product?.slug || "").toUpperCase();

  if (
    catStr.includes("material") ||
    catStr.includes("ingredient") ||
    catStr.includes("nguyen-lieu") ||
    catStr.includes("nguyen_lieu") ||
    nameStr.includes("nguyên liệu") ||
    nameStr.includes("trà") ||
    nameStr.includes("đường") ||
    nameStr.includes("bột") ||
    nameStr.includes("siro") ||
    skuUpper.startsWith("MAT")
  ) {
    return "MATERIAL";
  }

  if (
    catStr.includes("packaging") ||
    catStr.includes("bao-bi") ||
    catStr.includes("bao_bi") ||
    nameStr.includes("bao bì") ||
    nameStr.includes("túi") ||
    nameStr.includes("ống hút") ||
    nameStr.includes("muỗng") ||
    nameStr.includes("nắp") ||
    skuUpper.startsWith("PKG")
  ) {
    return "PACKAGING";
  }

  return "CUP";
}

function getVariantInfoLabels(type: "CUP" | "MATERIAL" | "PACKAGING", attrs: Record<string, any> = {}) {
  const normalizedAttrs = normalizeVariantAttributes(attrs, String(attrs.sku || ""));
  const capacityVal = normalizedAttrs.capacity || attrs.weight || attrs.size || attrs.spec || "";
  const styleVal = normalizedAttrs.style || attrs.specification || attrs.packaging || "";
  const materialVal = normalizedAttrs.material || attrs.type || attrs.brand || attrs.origin || "";
  const colorVal = normalizedAttrs.color || attrs.color || attrs.colour || attrs.mauSac || attrs.mau_sac || "";

  if (type === "MATERIAL") {
    return {
      col1Label: "DANH MỤC",
      col1Val: attrs.category || "-",
      col2Label: "LOẠI",
      col2Val: attrs.type || materialVal || "-",
      col3Label: "HƯƠNG VỊ",
      col3Val: attrs.flavor || "-",
      col4Label: "QUY CÁCH",
      col4Val: attrs.weight || attrs.spec || capacityVal || "-",
    };
  }

  if (type === "PACKAGING") {
    return {
      col1Label: "LOẠI BAO BÌ",
      col1Val: attrs.packaging || styleVal || "-",
      col2Label: "KÍCH THƯỚC",
      col2Val: capacityVal || "-",
      col3Label: "CHẤT LIỆU",
      col3Val: materialVal || "-",
      col4Label: "MÀU SẮC",
      col4Val: colorVal || "-",
    };
  }

  // Default for CUP
  return {
    col1Label: "DUNG TÍCH",
    col1Val: capacityVal || "-",
    col2Label: "KIỂU DÁNG",
    col2Val: styleVal || "-",
    col3Label: "CHẤT LIỆU",
    col3Val: materialVal || "-",
    col4Label: "MÀU SẮC",
    col4Val: colorVal || "-",
  };
}

function hasAnyVariantAttribute(attrs: Record<string, any> = {}) {
  return Object.values(attrs).some(
    (value) => value !== undefined && value !== null && String(value).trim(),
  );
}

export default function ProductVariantManagementPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigation] = useTransition();
  const productId = (params.id as string) || "";
  const categoryIdFromUrl = searchParams.get("categoryId") || "";

  const cachedPage = adminProductPageCache.get(productId);
  const [categories, setCategories] = useState<any[]>(() => cachedPage?.categories || []);
  const [product, setProduct] = useState<any | null>(() => cachedPage?.product || null);
  const [loading, setLoading] = useState(!cachedPage);
  const [saving, setSaving] = useState(false);

  // Form State
  const [prodName, setProdName] = useState(() => cachedPage?.prodName || "");
  const [prodSlug, setProdSlug] = useState(() => cachedPage?.prodSlug || "");
  const [prodDesc, setProdDesc] = useState(() => cachedPage?.prodDesc || "");
  const [prodImage, setProdImage] = useState(() => cachedPage?.prodImage || "");
  const [prodCategoryId, setProdCategoryId] = useState(() => cachedPage?.prodCategoryId || "");
  const [isUploadingProdImage, setIsUploadingProdImage] = useState(false);

  // Variants State
  const [prodVariants, setProdVariants] = useState<
    AdminProductVariantState[]
  >(() => cachedPage?.prodVariants || []);

  // Which variant row is currently being edited (-1 = none)
  const [editingVariantIdx, setEditingVariantIdx] = useState<number>(-1);

  // Load product data & variants from DB API
  const loadData = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      // 1. Lấy danh sách danh mục & sản phẩm
      const [catsRes, prodsRes] = await Promise.all([
        adminListCategories(),
        adminListProducts(),
      ]);

      const catsList = catsRes || [];
      const prodsList = prodsRes || [];
      setCategories(catsList);

      // Tìm sản phẩm theo id hoặc slug
      let foundProd = prodsList.find(
        (p: any) => String(p.id || p._id) === productId || String(p.slug) === productId
      );

      // Nếu không tìm thấy trong list, thử fetch trực tiếp theo detail
      if (!foundProd) {
        try {
          const detailRes = await publicApiFetch<any>(`/catalog/products/${encodeURIComponent(productId)}`);
          if (detailRes) {
            foundProd = detailRes.data || detailRes;
          }
        } catch (err) {
          console.warn("Product detail fetch error:", err);
        }
      }

      if (!foundProd) {
        toast.error("Không tìm thấy thông tin sản phẩm.");
        setLoading(false);
        return;
      }

      setProduct(foundProd);
      setProdName(foundProd.name || "");
      setProdSlug(foundProd.slug || "");
      setProdDesc(foundProd.description || "");
      setProdImage(
        foundProd.images && foundProd.images[0]
          ? foundProd.images[0]
          : foundProd.imageUrl || ""
      );
      setProdCategoryId(
        foundProd.categoryId ||
        foundProd.category?._id ||
        foundFoundCategory(catsList, foundProd) ||
        (catsList[0]?.id || "")
      );

      // 2. GỌI API LẤY VARIANT THỰC TẾ TỪ CSDL DATABASE
      const resolvedProductId = String(foundProd.id || foundProd._id || productId);
      let fetchedVariants = await adminGetProductVariants(
        resolvedProductId,
        foundProd.slug
      );
      const productIsActive =
        String(foundProd.status || "").toUpperCase() === "ACTIVE" ||
        foundProd.isActive === true;
      if (
        productIsActive &&
        fetchedVariants.some((variant: any) => variant?.isActive !== true)
      ) {
        fetchedVariants = await adminActivateProductVariants(resolvedProductId);
      }
      fetchedVariants = await Promise.all(
        fetchedVariants.map(async (variant: any) => {
          const rawAttrs = collectVariantAttributes(variant);
          if (hasAnyVariantAttribute(rawAttrs) || !variant?.sku || !variant?.id) {
            return variant;
          }

          try {
            const wmsResult = await listWmsItems({
              search: String(variant.sku),
              page: 1,
              limit: 10,
            });
            const wmsItem = (wmsResult.data || []).find(
              (item) => String(item.sku || "").toUpperCase() === String(variant.sku).toUpperCase(),
            );
            const wmsAttrs = collectWmsItemVariantAttributes(wmsItem);
            if (!hasAnyVariantAttribute(wmsAttrs)) return variant;

            return await adminUpdateVariant(String(variant.id || variant._id), {
              attributes: { ...rawAttrs, ...wmsAttrs },
              productId: resolvedProductId,
            });
          } catch (error) {
            console.warn("Could not enrich variant attributes from WMS:", variant.sku, error);
            return variant;
          }
        }),
      );

      const rawVars =
        fetchedVariants.length > 0
          ? fetchedVariants
          : Array.isArray(foundProd.variants) && foundProd.variants.length > 0
            ? foundProd.variants
            : [];

      const mappedVariants: AdminProductVariantState[] = rawVars.map((v: any) => {
        const sku = v.sku || (foundProd?.slug ? foundProd.slug.toUpperCase() : "SKU");
        const rawAttrs = collectVariantAttributes(v);
        const normalizedAttrs = normalizeVariantAttributes(rawAttrs, sku);
        return {
          id: v.id || v._id,
          sku,
          price: v.price !== undefined ? Number(v.price) : Number(foundProd?.price || 0),
          availableQty: v.availableQty ?? v.stockSnapshot ?? 0,
          attributes: { ...rawAttrs, ...normalizedAttrs },
          fulfillmentType: v.fulfillmentType || "STANDARD",
        };
      });
      setProdVariants(mappedVariants);
      adminProductPageCache.set(productId, {
        categories: catsList,
        product: foundProd,
        prodName: foundProd.name || "",
        prodSlug: foundProd.slug || "",
        prodDesc: foundProd.description || "",
        prodImage:
          foundProd.images && foundProd.images[0]
            ? foundProd.images[0]
            : foundProd.imageUrl || "",
        prodCategoryId:
          foundProd.categoryId ||
          foundProd.category?._id ||
          foundFoundCategory(catsList, foundProd) ||
          (catsList[0]?.id || ""),
        prodVariants: mappedVariants,
      });
    } catch (error) {
      console.error("Error loading product variants page:", error);
      toast.error("Lỗi khi tải dữ liệu sản phẩm & variant.");
    } finally {
      setLoading(false);
    }
  };

  const foundFoundCategory = (catList: any[], prod: any) => {
    if (!prod.category) return "";
    if (typeof prod.category === "object") return prod.category.id || prod.category._id;
    const match = catList.find((c) => c.slug === prod.category || c.id === prod.category);
    return match ? match.id || match._id : "";
  };

  useEffect(() => {
    loadData();
  }, [productId]);

  const handleVariantPriceChange = (index: number, val: number) => {
    setProdVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], price: val };
      return next;
    });
  };

  const handleVariantSkuChange = (index: number, val: string) => {
    setProdVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], sku: val };
      return next;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProdImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64DataUrl = reader.result as string;
          toast.info("Đang xử lý & tải ảnh lên...");
          const resUrl = await adminUploadProductImage(base64DataUrl);
          setProdImage(resUrl);
          if (resUrl.startsWith("http")) {
            toast.success("Tải ảnh lên Cloudinary thành công!");
          } else {
            toast.success("Đã chọn ảnh thành công!");
          }
        } catch (err) {
          console.error("Upload image error:", err);
          setProdImage(reader.result as string);
          toast.warning("Đã lưu ảnh preview");
        } finally {
          setIsUploadingProdImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("FileReader error:", err);
      setIsUploadingProdImage(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !prodName.trim() || !prodSlug.trim()) {
      toast.error("Vui lòng nhập tên và slug sản phẩm.");
      return;
    }

    setSaving(true);
    try {
      const pId = product.id || product._id || productId;
      const updatedSlug = prodSlug
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");
      const imageToSave = prodImage.trim();

      // Cập nhật từng variant qua adminUpdateVariant API
      const updatedVariantsList: any[] = [];
      for (const v of prodVariants) {
        let savedVar = v;
        if (v.id) {
          try {
            savedVar = await adminUpdateVariant(v.id, {
              sku: v.sku.trim(),
              price: Number(v.price),
              attributes: v.attributes,
              fulfillmentType: v.fulfillmentType,
              productId: pId,
              productSlug: updatedSlug,
            });
          } catch (err) {
            console.warn("Update variant error:", err);
          }
        }
        updatedVariantsList.push({
          ...v,
          ...savedVar,
          sku: v.sku.trim(),
          price: Number(v.price),
        });
      }

      // Cập nhật thông tin sản phẩm qua adminUpdateProduct API
      await adminUpdateProduct(pId, {
        name: prodName.trim(),
        slug: updatedSlug,
        description: prodDesc,
        categoryId: prodCategoryId,
        images: imageToSave ? [imageToSave] : [],
      });
      toast.success("Đã lưu");
      loadData();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Cập nhật sản phẩm & Variant thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!product) return;
    const pId = product.id || product._id || productId;
    try {
      await adminPublishProductWithVariants(pId);
      toast.success("Đã đưa sản phẩm lên kệ Ecommerce thành công!");
      loadData();
    } catch (error: any) {
      console.error(error);
      toast.error("Đưa sản phẩm lên kệ thất bại.");
    }
  };

  const minVariantPrice = useMemo(() => {
    const validPrices = prodVariants
      .map((v) => Number(v.price))
      .filter((pr) => !isNaN(pr) && pr > 0);
    return validPrices.length > 0 ? Math.min(...validPrices) : Number(product?.price || 0);
  }, [prodVariants, product]);

  const handleBackToCategory = () => {
    startNavigation(() => {
      router.replace(getBackToCategoryHref());
    });
  };

  const getBackToCategoryHref = () => {
    const backCategoryId =
      categoryIdFromUrl ||
      prodCategoryId ||
      product?.categoryId ||
      product?.category?._id ||
      product?.category?.id;
    const categoryQuery = backCategoryId ? `?categoryId=${encodeURIComponent(String(backCategoryId))}` : "";
    return `/admin/catalog/categories${categoryQuery}`;
  };

  if (loading && !product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
        <span className="text-sm font-bold text-slate-600">
          Đang tải danh sách sản phẩm
        </span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="size-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Sản phẩm không tồn tại</h2>
        <Button onClick={handleBackToCategory}>
          <ArrowLeft className="size-4 mr-2" /> Quay lại quản lý danh mục
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-10">
      {/* ONE SINGLE MASTER CARD CONTAINER FOR THE ENTIRE PAGE */}
      <Card className="rounded-2xl border border-[#E9E3DD] bg-white shadow-sm overflow-hidden divide-y divide-[#E9E3DD]">
        {/* SECTION 1: Top Navigation Header */}
        <div className="py-4 px-6 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBackToCategory}
              onMouseEnter={() => router.prefetch(getBackToCategoryHref())}
              onFocus={() => router.prefetch(getBackToCategoryHref())}
              disabled={isNavigating}
              className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="size-4 text-emerald-600" />
              <span>Quay lại</span>
            </Button>

            <div className="h-4 w-px bg-slate-200 hidden sm:block" />

            <div>
              <h1 className="text-base font-black text-slate-800 flex items-center gap-2">
                <span>{product.name}</span>
                <Badge
                  className={
                    product.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]"
                      : "bg-amber-100 text-amber-800 border-amber-300 font-bold text-[10px]"
                  }
                >
                  {product.status === "ACTIVE" ? "Đã lên kệ" : "Bản nháp (Draft)"}
                </Badge>
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Mã ID: <span className="font-mono">{product.id || product._id}</span> · Slug:{" "}
                <span className="font-mono text-slate-600">{product.slug}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {product.status === "DRAFT" && (
              <Button
                type="button"
                onClick={handlePublish}
                className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs gap-1.5 cursor-pointer border-0"
              >
                <Rocket className="size-4" />
                <span>Đưa lên kệ ngay</span>
              </Button>
            )}
          </div>
        </div>

        {/* SECTION 2: Master Form Body */}
        <form onSubmit={handleSave} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-[#E9E3DD]">
            {/* COLUMN 1: PRODUCT INFO & IMAGE (5 cols) */}
            <div className="lg:col-span-5 space-y-5 lg:pr-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Tag className="size-4 text-emerald-600" />
                <span>Thông tin sản phẩm</span>
              </h3>

              <div className="space-y-1.5">
                <Label htmlFor="pName" className="text-xs font-bold text-slate-700">
                  Tên sản phẩm *
                </Label>
                <Input
                  id="pName"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="Nhập tên sản phẩm..."
                  className="h-10 text-xs rounded-xl font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pSlug" className="text-xs font-bold text-slate-700">
                  Slug *
                </Label>
                <Input
                  id="pSlug"
                  value={prodSlug}
                  onChange={(e) => setProdSlug(e.target.value)}
                  placeholder="ten-san-pham"
                  className="h-10 text-xs font-mono text-slate-600 rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pCat" className="text-xs font-bold text-slate-700">
                  Danh mục *
                </Label>
                <select
                  id="pCat"
                  value={prodCategoryId}
                  onChange={(e) => setProdCategoryId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 font-bold focus:border-emerald-500 focus:outline-none"
                >
                  {categories.map((c) => {
                    const cId = c.id || c._id;
                    return (
                      <option key={cId} value={cId}>
                        {c.name} ({c.slug})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pPrice" className="text-xs font-bold text-slate-700">
                  Giá hiển thị
                </Label>
                <Input
                  id="pPrice"
                  disabled
                  value={formatCurrency(minVariantPrice)}
                  className="h-10 text-xs rounded-xl font-black text-slate-600 bg-slate-100 cursor-not-allowed border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pDesc" className="text-xs font-bold text-slate-700">
                  Mô tả sản phẩm
                </Label>
                <Textarea
                  id="pDesc"
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  rows={3}
                  placeholder="Nhập mô tả sản phẩm..."
                  className="text-xs rounded-xl leading-relaxed"
                />
              </div>

              {/* Product Image */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <Label className="text-xs font-bold text-slate-700">Hình ảnh đại diện</Label>
                <div className="flex items-center gap-3">
                  <div className="relative size-20 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center group shadow-2xs">
                    {isUploadingProdImage ? (
                      <div className="flex flex-col items-center gap-1">
                        <Loader2 className="size-5 text-emerald-600 animate-spin" />
                        <span className="text-[9px] text-slate-500 font-bold">Uploading...</span>
                      </div>
                    ) : prodImage ? (
                      <>
                        <img src={prodImage} alt="Preview" className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProdImage("")}
                          className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] font-bold gap-1"
                        >
                          <Trash2 className="size-4 text-rose-400" />
                          <span>Xóa</span>
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="size-7 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      id="prod-detail-image-upload"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploadingProdImage}
                      className="hidden"
                    />
                    <label
                      htmlFor="prod-detail-image-upload"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <Upload className="size-4 text-emerald-600" />
                      <span>{prodImage ? "Thay đổi ảnh" : "Tải ảnh lên"}</span>
                    </label>
                    <p className="text-[11px] text-slate-400 font-medium">
                      Tải ảnh trực tiếp từ máy (Cloudinary URL)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUMN 2: VARIANT LIST */}
            <div className="lg:col-span-7 space-y-4 pt-6 lg:pt-0 lg:pl-8">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="size-4 text-emerald-600" />
                  <span>Danh sách variant ({prodVariants.length})</span>
                </h3>
              </div>

              {/* READ-ONLY LIST */}
              <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-[#E9E3DD]">
                {prodVariants.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 font-medium bg-slate-50">
                    Không tìm thấy variant nào từ CSDL.
                  </div>
                ) : (
                  prodVariants.map((varItem, idx) => {
                    const attrs = varItem.attributes || {};
                    const pType = getProductType(product, varItem.sku);
                    const info = getVariantInfoLabels(pType, attrs);
                    const isEditing = editingVariantIdx === idx;

                    return (
                      <div
                        key={varItem.id ? `${varItem.id}-${idx}` : `variant-key-${idx}`}
                        className={`border-b border-[#E9E3DD] last:border-b-0 transition-colors ${isEditing ? "bg-emerald-50/40" : "bg-white hover:bg-slate-50/60"
                          }`}
                      >
                        {/* ROW: Read-only summary */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <Badge className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md shrink-0">
                            #{idx + 1}
                          </Badge>

                          <span className="font-mono text-xs font-bold text-slate-700 shrink-0 w-36 truncate">
                            {varItem.sku}
                          </span>

                          <div className="flex-1 flex items-center gap-4 min-w-0">
                            <span className="text-xs text-slate-500 truncate hidden sm:block">
                              {[info.col1Val, info.col2Val, info.col3Val]
                                .filter((value) => value && value !== "-")
                                .join(" · ")}
                            </span>
                          </div>

                          <span className="text-xs font-black text-emerald-700 font-mono shrink-0">
                            {formatCurrency(Number(varItem.price || 0))}
                          </span>

                          <Badge variant="outline" className="text-[10px] font-bold text-slate-500 border-slate-200 bg-white shrink-0 hidden sm:flex">
                            {varItem.availableQty ?? 0} sp
                          </Badge>

                          <Button
                            type="button"
                            size="sm"
                            variant={isEditing ? "outline" : "ghost"}
                            onClick={() => setEditingVariantIdx(isEditing ? -1 : idx)}
                            className={`h-7 px-2.5 text-[11px] font-bold rounded-lg shrink-0 cursor-pointer ${isEditing
                              ? "border-slate-300 text-slate-600"
                              : "text-emerald-700 hover:bg-emerald-50"
                              }`}
                          >
                            {isEditing ? (
                              <><X className="size-3.5 mr-1" />Đóng</>
                            ) : (
                              <><Pencil className="size-3.5 mr-1" />Sửa</>
                            )}
                          </Button>
                        </div>

                        {/* INLINE EDIT PANEL */}
                        {isEditing && (
                          <div className="px-4 pb-4 space-y-3 border-t border-emerald-200/60">
                            {/* Attributes preview */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 p-3 rounded-xl bg-white border border-slate-100 text-xs">
                              <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">{info.col1Label}</span>
                                <span className="font-bold text-slate-900">{info.col1Val || "-"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">{info.col2Label}</span>
                                <span className="font-bold text-slate-800">{info.col2Val || "-"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">{info.col3Label}</span>
                                <span className="font-bold text-slate-800">{info.col3Val || "-"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">{info.col4Label}</span>
                                <span className="font-bold text-slate-800">{info.col4Val || "-"}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">Tồn kho</span>
                                <span className="font-black text-emerald-700">{varItem.availableQty ?? 0} sp</span>
                              </div>
                            </div>

                            {/* SKU + Price edit */}
                            <div className="flex flex-col sm:flex-row gap-3">
                              <div className="flex-1 space-y-1">
                                <Label className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wide">SKU</Label>
                                <Input
                                  value={varItem.sku}
                                  onChange={(e) => handleVariantSkuChange(idx, e.target.value)}
                                  className="h-9 text-xs font-mono font-bold text-slate-800 rounded-lg bg-white border-slate-200"
                                />
                              </div>

                              <div className="flex-1 space-y-1">
                                <Label className="text-[10.5px] font-bold text-emerald-800 uppercase tracking-wide">Giá bán (VNĐ) *</Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={varItem.price}
                                    onChange={(e) => handleVariantPriceChange(idx, Number(e.target.value))}
                                    className="h-9 text-sm font-black text-emerald-700 bg-emerald-50/50 border-emerald-300 focus:border-emerald-600 rounded-lg"
                                    placeholder="50000"
                                  />
                                  <span className="absolute right-3 top-2 text-xs font-bold text-emerald-600 pointer-events-none">VNĐ</span>
                                </div>
                              </div>

                              <div className="flex items-end gap-2 shrink-0">
                                <Button
                                  type="button"
                                  onClick={() => {
                                    toast.info("Đã cập nhật variant tạm thời. Bấm Lưu thông tin sản phẩm để lưu lên hệ thống.");
                                    setEditingVariantIdx(-1);
                                  }}
                                  className="h-9 px-3 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg border-0 cursor-pointer gap-1.5"
                                >
                                  <CheckCircle2 className="size-3.5" />
                                  OK
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setEditingVariantIdx(-1)}
                                  className="h-9 px-3 text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  Hủy
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#E9E3DD] pt-5 sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="h-10 px-6 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer border-0"
            >
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              <span>Lưu thông tin sản phẩm</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
