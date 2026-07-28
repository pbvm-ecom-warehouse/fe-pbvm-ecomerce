"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  RefreshCw,
  Plus,
  Upload,
  Loader2,
  Trash2,
  Image as ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import type { WmsWarehouseItem } from "../services/wms-stock.service";
import {
  adminCreateProduct,
  adminUpdateProduct,
  adminCreateVariant,
  adminPublishProductWithVariants,
  adminListCategories,
  adminUploadProductImage,
  adminListInactiveProducts,
} from "../services/admin-catalog.service";
import { listCatalogProducts } from "../services/catalog.service";
import type { FulfillmentType } from "@/types/api";

type SyncItem = WmsWarehouseItem & {
  source?: "WMS" | "INACTIVE_PRODUCT" | "CATALOG";
  variantId?: string;
  variantIds?: string[];
  productId?: string;
  price?: number;
};

function getEntityId(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "object") {
    const id = value.id || value._id;
    return id ? String(id) : undefined;
  }
  return undefined;
}

function isObjectId(value: string) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

function productToSyncItem(product: any, source: SyncItem["source"]): SyncItem | null {
  const productId = getEntityId(product) || "";
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const mainVariant = variants[0] || {};
  const sku = String(mainVariant.sku || product.sku || product.slug || "");
  if (!sku) return null;

  const attrs = mainVariant.attributes || product.attributes || {};
  return {
    id: productId || sku,
    _id: productId || sku,
    productId,
    variantId: mainVariant.id || mainVariant._id ? String(mainVariant.id || mainVariant._id) : undefined,
    variantIds: variants
      .map((variant: any) => variant.id || variant._id)
      .filter(Boolean)
      .map((id: any) => String(id)),
    sku,
    name: product.name || sku,
    type: "CUP_BLANK",
    attributes: Object.entries(attrs).map(([key, value]) => ({
      key: String(key).toUpperCase(),
      name: String(key).toUpperCase(),
      value: String(value),
      code: String(value),
    })),
    unit: product.unit || "sp",
    minQuantity: 0,
    availableQty: variants.reduce(
      (sum: number, variant: any) => sum + Number(variant.availableQty ?? 0),
      0,
    ),
    isActive: product.status === "ACTIVE" || product.isActive === true,
    price: Number(mainVariant.price ?? product.price ?? 0),
    categoryId: getEntityId(product.categoryId) || getEntityId(product.category),
    slug: product.slug,
    description: product.description,
    images: Array.isArray(product.images) ? product.images : [],
    imageUrl: product.imageUrl,
    source,
  } as SyncItem;
}

function slugifyProductName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function buildSyncItemsFromCatalogProducts(
  catalogProducts: any[],
  inactiveProducts: any[],
): SyncItem[] {
  const byProductId = new Map<string, SyncItem>();
  for (const product of [...catalogProducts, ...inactiveProducts]) {
    const productId = String(product.id || product._id || "");
    if (!productId || byProductId.has(productId)) continue;
    const item = productToSyncItem(
      product,
      product.status === "ACTIVE" || product.isActive === true ? "CATALOG" : "INACTIVE_PRODUCT",
    );
    if (item) byProductId.set(productId, item);
  }
  return Array.from(byProductId.values());
}

interface WmsSyncToEcomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategoryId?: string;
  onSuccess?: () => void;
}

export function WmsSyncToEcomModal({
  open,
  onOpenChange,
  initialCategoryId,
  onSuccess,
}: WmsSyncToEcomModalProps) {
  const [wmsItems, setWmsItems] = useState<SyncItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Selected WMS item & Form state
  const [selectedItem, setSelectedItem] = useState<SyncItem | null>(null);
  const [ecomName, setEcomName] = useState("");
  const [ecomSlug, setEcomSlug] = useState("");
  const [ecomDesc, setEcomDesc] = useState("");
  const [ecomPrice, setEcomPrice] = useState<number | "">(50000);
  const [ecomCategoryId, setEcomCategoryId] = useState("");
  const [ecomFulfillment, setEcomFulfillment] = useState<FulfillmentType>("STANDARD");
  const [ecomStyle, setEcomStyle] = useState("");
  const [ecomSize, setEcomSize] = useState("");
  const [ecomMaterial, setEcomMaterial] = useState("");
  const [ecomColor, setEcomColor] = useState("");
  const [ecomImage, setEcomImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64DataUrl = reader.result as string;
          toast.info("Đang xử lý & tải ảnh lên...");
          const resUrl = await adminUploadProductImage(base64DataUrl);
          setEcomImage(resUrl);
          if (resUrl.startsWith("http")) {
            toast.success("Tải ảnh lên Cloudinary thành công!");
          } else {
            toast.success("Đã chọn ảnh thành công!");
          }
        } catch (err) {
          console.error("Cloudinary upload error:", err);
          setEcomImage(reader.result as string);
          toast.warning("Đã lưu ảnh (dùng preview local)");
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("FileReader error:", err);
      setIsUploadingImage(false);
    }
  };

  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, catalogRes, inactiveProductRes] = await Promise.all([
        adminListCategories().catch(() => []),
        listCatalogProducts().catch(() => ({ data: [] })),
        adminListInactiveProducts().catch(() => []),
      ]);

      let itemsList: any[] = [];

      const catsList = catRes || [];
      const catalogProds = catalogRes && Array.isArray((catalogRes as any).data) ? (catalogRes as any).data : [];
      const inactiveProducts = Array.isArray(inactiveProductRes) ? inactiveProductRes : [];
      itemsList = buildSyncItemsFromCatalogProducts(catalogProds, inactiveProducts);

      setWmsItems(itemsList);
      setCategories(catsList);

      if (initialCategoryId) {
        setEcomCategoryId(initialCategoryId);
      } else if (catsList.length > 0) {
        setEcomCategoryId(catsList[0].id || catsList[0]._id);
      }

      if (itemsList.length > 0) {
        handleSelectItem(itemsList[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, initialCategoryId]);

  // Pre-fill form inputs from selected WMS Item
  const handleSelectItem = (item: SyncItem) => {
    setSelectedItem(item);
    setEcomName(item.name);
    if ((item as any).categoryId) {
      setEcomCategoryId(String((item as any).categoryId));
    }
    setEcomSlug(
      item.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-"),
    );

    setEcomDesc(`Mặt hàng ${item.name} đồng bộ trực tiếp từ kho WMS. SKU: ${item.sku}.`);

    if ((item as any).slug) setEcomSlug(String((item as any).slug));
    if ((item as any).description) setEcomDesc(String((item as any).description));

    const rawAttrs = Array.isArray(item.attributes)
      ? item.attributes
      : Object.entries(item.attributes || {}).map(([key, value]) => ({
        key,
        name: key,
        value: String(value),
        code: String(value),
      }));

    const styleAttr = rawAttrs.find(
      (a) =>
        a.key === "CUP_STYLE" ||
        a.key === "STYLE" ||
        a.key === "PACKAGING" ||
        a.key === "BAO_BI" ||
        (a.name &&
          (a.name.toLowerCase().includes("kiểu dáng") ||
            a.name.toLowerCase().includes("bao bì") ||
            a.name.toLowerCase().includes("đóng gói"))),
    );
    const capacityAttr = rawAttrs.find(
      (a) =>
        a.key === "CAPACITY" ||
        a.key === "SIZE" ||
        a.key === "SPEC" ||
        a.key === "WEIGHT" ||
        a.key === "TRONG_LUONG" ||
        (a.name &&
          (a.name.toLowerCase().includes("dung tích") ||
            a.name.toLowerCase().includes("kích thước") ||
            a.name.toLowerCase().includes("trọng lượng"))),
    );
    const materialAttr = rawAttrs.find(
      (a) =>
        a.key === "MATERIAL" ||
        a.key === "ORIGIN" ||
        a.key === "NGUON_GOC" ||
        a.key === "XUAT_XU" ||
        (a.name &&
          (a.name.toLowerCase().includes("chất liệu") ||
            a.name.toLowerCase().includes("nguồn gốc") ||
            a.name.toLowerCase().includes("xuất xứ"))),
    );
    const colorAttr = rawAttrs.find(
      (a) => a.key === "COLOR" || (a.name && a.name.toLowerCase().includes("màu sắc")),
    );

    const isMatItem =
      item.type === "MATERIAL" ||
      item.sku?.startsWith("MAT") ||
      item.name?.toLowerCase().includes("nguyên liệu") ||
      item.name?.toLowerCase().includes("trà");

    if (isMatItem) {
      setEcomStyle(styleAttr ? styleAttr.value || styleAttr.code : "Túi Kraft");
      setEcomSize(capacityAttr ? capacityAttr.value || capacityAttr.code : "500g");
      setEcomMaterial(materialAttr ? materialAttr.value || materialAttr.code : "Đài Loan");
      setEcomColor(colorAttr ? colorAttr.value || colorAttr.code : "Tự nhiên");

      const ingCat = categories.find(
        (c) =>
          c.slug === "ingredient" ||
          c.slug === "nguyen-lieu" ||
          c.name?.toLowerCase().includes("nguyên liệu"),
      );
      if (ingCat) {
        setEcomCategoryId(ingCat.id || ingCat._id);
      }
    } else {
      setEcomStyle(styleAttr ? styleAttr.value || styleAttr.code : "");
      setEcomSize(capacityAttr ? capacityAttr.value || capacityAttr.code : "500ml");
      setEcomMaterial(materialAttr ? materialAttr.value || materialAttr.code : "Nhựa PET");
      setEcomColor(colorAttr ? colorAttr.value || colorAttr.code : "Trong suốt");
    }

    // Không tự điền ảnh giả — người dùng upload ảnh thật sau khi tạo sản phẩm
    setEcomImage((item as any).imageUrl || (item as any).images?.[0] || "");
    if (item.price !== undefined && item.price > 0) {
      setEcomPrice(item.price);
    }
  };

  const handleNameChange = (val: string) => {
    setEcomName(val);
    setEcomSlug(
      val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-"),
    );
  };



  const handleSubmitSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const isSelectedExistingProduct =
      selectedItem?.source === "INACTIVE_PRODUCT" || selectedItem?.source === "CATALOG";
    if (!selectedItem || !ecomName.trim() || !ecomSlug.trim() || !ecomCategoryId) {
      toast.error("Vui lòng chọn mặt hàng WMS và nhập tên sản phẩm.");
      return;
    }

    if (!isObjectId(ecomCategoryId)) {
      toast.error("Danh mục không hợp lệ. Vui lòng chọn lại danh mục trước khi đồng bộ.");
      return;
    }

    setSubmitting(true);
    try {
      if (isSelectedExistingProduct && selectedItem.productId) {
        if (selectedItem.productId) {
          const productPatch: Parameters<typeof adminUpdateProduct>[1] = {
            name: ecomName.trim(),
            slug: ecomSlug.trim().toLowerCase(),
            description: ecomDesc,
            categoryId: ecomCategoryId,
          };
          if (ecomImage) productPatch.images = [ecomImage];
          await adminUpdateProduct(selectedItem.productId, productPatch);
          await adminPublishProductWithVariants(selectedItem.productId);
        }
        toast.success(`Da cap nhat va day san pham "${ecomName}" vao danh muc thanh cong!`);
        if (onSuccess) onSuccess();
        onOpenChange(false);
        return;
      }

      // 1. Create Product (DRAFT)
      const productPayload = {
        name: ecomName.trim(),
        slug: ecomSlug.trim().toLowerCase(),
        description: ecomDesc,
        images: ecomImage ? [ecomImage] : [],
        categoryId: ecomCategoryId,
        status: "DRAFT",
      };

      const product = await adminCreateProduct(productPayload);
      const productId = String(product.id || product._id);

      // 2. Create Variant with existing WMS SKU & attributes
      const variantPayload = {
        sku: selectedItem.sku,
        productId,
        price: Number(ecomPrice) || 0,
        fulfillmentType: "STANDARD" as FulfillmentType,
        attributes: {
          capacity: ecomSize,
          size: ecomSize,
          spec: ecomSize,
          style: ecomStyle,
          packaging: ecomStyle,
          material: ecomMaterial,
          origin: ecomMaterial,
          color: ecomColor,
        },
      };

      await adminCreateVariant(variantPayload);

      // 4. Approve product and activate its variants
      await adminPublishProductWithVariants(productId);

      const targetCategoryObj = categories.find((c) => (c.id || c._id) === ecomCategoryId);
      const catName = targetCategoryObj ? targetCategoryObj.name : "danh mục";

      toast.success(
        `Đã tạo & duyệt sản phẩm "${ecomName}" vào danh mục "${catName}" (SKU: ${selectedItem.sku}) thành công!`,
      );

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Đẩy hàng lên Ecommerce thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCatObj = categories.find((c) => (c.id || c._id) === ecomCategoryId);
  const isInactiveApproval =
    selectedItem?.source === "INACTIVE_PRODUCT" || selectedItem?.source === "CATALOG";
  const isMaterial =
    selectedItem?.type === "MATERIAL" ||
    selectedItem?.sku?.startsWith("MAT") ||
    selectedCatObj?.slug === "ingredient" ||
    selectedCatObj?.slug === "nguyen-lieu" ||
    selectedCatObj?.name?.toLowerCase().includes("nguyên liệu") ||
    selectedCatObj?.name?.toLowerCase().includes("trà");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl bg-white border-[#E9E3DD] p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Plus className="size-4 text-emerald-600" />
            <span>Duyệt sản phẩm &amp; Gán vào danh mục</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Chọn mặt hàng WMS, chọn danh mục thuộc về và thiết lập thông số sản phẩm.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="size-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
              <div className="text-xs text-slate-400 font-medium">Đang kết nối danh mục &amp; Kho WMS...</div>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmitSync}
            className="space-y-4 pt-2"
          >
            {/* 1. Chọn mặt hàng Kho WMS */}
            <div className="space-y-1.5 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
              <Label htmlFor="wmsItemDropdown" className="text-xs font-bold text-emerald-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4 text-emerald-600" />
                  <span>Mặt hàng</span>
                </span>
              </Label>
              <select
                id="wmsItemDropdown"
                value={selectedItem?.productId || selectedItem?.sku || ""}
                onChange={(e) => {
                  const found = wmsItems.find(
                    (i) => (i.productId || i.sku) === e.target.value,
                  );
                  if (found) handleSelectItem(found);
                }}
                className="h-10 w-full rounded-xl border border-emerald-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                {wmsItems.map((item) => (
                  <option key={item.productId || item.sku} value={item.productId || item.sku}>
                    Mã SKU: {item.sku} — {item.name}
                  </option>
                ))}
              </select>
              {selectedItem && (
                <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-emerald-900">
                  <span className="bg-emerald-200/90 text-emerald-950 px-2 py-0.5 rounded-md font-mono font-bold">
                    SKU Kho: {selectedItem.sku}
                  </span>
                  <span className="text-slate-500 text-[10px] font-medium">
                    (Cố định từ Kho WMS — Manager chỉ duyệt &amp; đẩy lên Shop Ecom)
                  </span>
                </div>
              )}
            </div>

            {/* 1.5. XEM TRƯỚC & CHỈNH SỬA THÔNG SỐ VARIANT (DUNG TÍCH, KIỂU DÁNG, CHẤT LIỆU, TRỌNG LƯỢNG, XUẤT XỨ) */}
            {!isInactiveApproval && selectedItem && (() => {
              const pType =
                selectedItem.type === "MATERIAL" || selectedItem.sku?.startsWith("MAT")
                  ? "MATERIAL"
                  : selectedItem.type === "PACKAGING" || selectedItem.sku?.startsWith("PKG")
                    ? "PACKAGING"
                    : "CUP";

              const col1Label =
                pType === "MATERIAL"
                  ? "TRỌNG LƯỢNG"
                  : pType === "PACKAGING"
                    ? "KÍCH THƯỚC"
                    : "DUNG TÍCH";

              const col2Label =
                pType === "MATERIAL"
                  ? "BAO BÌ"
                  : pType === "PACKAGING"
                    ? "QUY CÁCH BAO BÌ"
                    : "KIỂU DÁNG";

              const col3Label =
                pType === "MATERIAL"
                  ? "NGUỒN GỐC"
                  : pType === "PACKAGING"
                    ? "CHẤT LIỆU BAO BÌ"
                    : "CHẤT LIỆU";

              return (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>THÔNG TIN CHI TIẾT SẢN PHẨM</span>
                  </div>

                  {/* THÔNG SỐ BANNER PREVIEW */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                        {col1Label}
                      </span>
                      <span className="font-bold text-slate-900">{ecomSize || "-"}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                        {col2Label}
                      </span>
                      <span className="font-bold text-slate-800">{ecomStyle || "-"}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                        {col3Label}
                      </span>
                      <span className="font-bold text-slate-800">{ecomMaterial || "-"}</span>
                    </div>

                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                        TỒN KHO
                      </span>
                      <span className="font-black text-emerald-700">
                        {(selectedItem as any).totalQuantity ?? (selectedItem as any).availableQty ?? 0} sản phẩm
                      </span>
                    </div>
                  </div>

                  {/* CHỈNH SỬA TRỰC TIẾP CÁC THÔNG SỐ VARIANT */}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div>
                      <Label className="text-[10.5px] font-bold text-slate-600 block mb-1">{col1Label}</Label>
                      <Input
                        value={ecomSize}
                        onChange={(e) => setEcomSize(e.target.value)}
                        placeholder="500ml / 500g"
                        className="h-8 text-xs rounded-lg font-bold bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[10.5px] font-bold text-slate-600 block mb-1">{col2Label}</Label>
                      <Input
                        value={ecomStyle}
                        onChange={(e) => setEcomStyle(e.target.value)}
                        placeholder="Nắp phẳng / Túi Kraft"
                        className="h-8 text-xs rounded-lg font-bold bg-white"
                      />
                    </div>
                    <div>
                      <Label className="text-[10.5px] font-bold text-slate-600 block mb-1">{col3Label}</Label>
                      <Input
                        value={ecomMaterial}
                        onChange={(e) => setEcomMaterial(e.target.value)}
                        placeholder="Nhựa PET / Đài Loan"
                        className="h-8 text-xs rounded-lg font-bold bg-white"
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 2. Danh mục Ecommerce */}
            <div className="space-y-1.5">
              <Label htmlFor="eCat" className="text-xs font-bold text-emerald-800">Danh mục *</Label>
              <select
                id="eCat"
                value={ecomCategoryId}
                onChange={(e) => setEcomCategoryId(e.target.value)}
                className="h-10 w-full rounded-xl border border-emerald-300 bg-emerald-50/30 px-3 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none cursor-pointer"
              >
                {categories.map((c) => {
                  const catId = c.id || c._id;
                  return (
                    <option key={catId} value={catId}>
                      {c.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 3. Tên sản phẩm */}
            <div className="space-y-1.5">
              <Label htmlFor="eName" className="text-xs font-bold text-slate-700">Tên sản phẩm *</Label>
              <Input
                id="eName"
                value={ecomName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Nhập tên sản phẩm..."
                className="h-10 text-xs rounded-xl font-semibold"
              />
            </div>

            {/* 4. Hình ảnh sản phẩm (Upload từ máy) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Hình ảnh sản phẩm (Tải ảnh từ máy)</Label>
              <div className="flex items-center gap-3">
                <div className="relative size-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center group shadow-2xs">
                  {isUploadingImage ? (
                    <div className="flex flex-col items-center gap-1">
                      <Loader2 className="size-5 text-emerald-600 animate-spin" />
                      <span className="text-[9px] text-slate-500 font-bold">Uploading...</span>
                    </div>
                  ) : ecomImage ? (
                    <>
                      <img src={ecomImage} alt="Preview" className="size-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEcomImage("")}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] font-bold gap-1 cursor-pointer"
                      >
                        <Trash2 className="size-3.5 text-rose-400" />
                        <span>Xóa</span>
                      </button>
                    </>
                  ) : (
                    <ImageIcon className="size-6 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    id="wms-image-upload"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={isUploadingImage}
                    className="hidden"
                  />
                  <label
                    htmlFor="wms-image-upload"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Upload className="size-4 text-emerald-600" />
                    <span>{ecomImage ? "Thay đổi ảnh" : "Tải ảnh lên"}</span>
                  </label>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Tải ảnh trực tiếp từ máy tính (Tự động upload lên Cloudinary & lưu URL)
                  </p>
                </div>
              </div>
            </div>

            {/* 5. Mô tả sản phẩm */}
            <div className="space-y-1.5">
              <Label htmlFor="eDesc" className="text-xs font-bold text-slate-600">Mô tả sản phẩm</Label>
              <Textarea
                id="eDesc"
                value={ecomDesc}
                onChange={(e) => setEcomDesc(e.target.value)}
                rows={3}
                placeholder="Nhập mô tả sản phẩm..."
                className="text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-3 border-t flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="h-9 text-xs font-bold rounded-xl"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 border-0 shadow-sm"
              >
                {submitting ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                Tạo &amp; Đẩy Lên Kệ
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
