"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
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

import {
  listWmsItems,
  wmsStaffLogin,
  type WmsWarehouseItem,
} from "../services/wms-stock.service";
import {
  adminCreateProduct,
  adminCreateVariant,
  adminPublishProduct,
  adminListCategories,
  adminUploadProductImage,
} from "../services/admin-catalog.service";
import type { FulfillmentType } from "@/types/api";

interface WmsSyncToEcomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategoryId?: string;
  onSuccess: () => void;
}

export function WmsSyncToEcomModal({
  open,
  onOpenChange,
  initialCategoryId,
  onSuccess,
}: WmsSyncToEcomModalProps) {
  const [wmsItems, setWmsItems] = useState<WmsWarehouseItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUnauthorized, setIsUnauthorized] = useState(false);
  const [wmsUser, setWmsUser] = useState("admin");
  const [wmsPass, setWmsPass] = useState("P@ssw0rd123!");
  const [wmsAuthLoading, setWmsAuthLoading] = useState(false);

  // Selected WMS item & Form state
  const [selectedItem, setSelectedItem] = useState<WmsWarehouseItem | null>(null);
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
          toast.warning("Đã lưu ảnh");
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
    setIsUnauthorized(false);
    try {
      const [itemRes, catRes] = await Promise.all([
        listWmsItems({ isActive: true, limit: 100 }),
        adminListCategories(),
      ]);

      const itemsList = itemRes.data || [];
      const catsList = catRes || [];

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
      if (err?.response?.status === 401) {
        try {
          await wmsStaffLogin("admin", "P@ssw0rd123!");
          const [retryItems, retryCats] = await Promise.all([
            listWmsItems({ isActive: true, limit: 100 }),
            adminListCategories(),
          ]);
          const itemsList = retryItems.data || [];
          const catsList = retryCats || [];

          setWmsItems(itemsList);
          setCategories(catsList);
          if (initialCategoryId) {
            setEcomCategoryId(initialCategoryId);
          } else if (catsList.length > 0) {
            setEcomCategoryId(catsList[0].id || catsList[0]._id);
          }
          if (itemsList.length > 0) handleSelectItem(itemsList[0]);

          setIsUnauthorized(false);
          toast.success("Đã tự động xác thực kết nối Kho WMS!");
        } catch {
          setIsUnauthorized(true);
          toast.error("Vui lòng xác thực tài khoản WMS Staff bên dưới.");
        }
      } else if (err?.code === "ECONNABORTED" || err?.message?.includes("timeout")) {
        toast.error("Máy chủ Kho (WMS) phản hồi chậm (Timeout). Vui lòng kiểm tra kết nối.");
      } else {
        toast.error("Lấy danh sách mặt hàng kho WMS thất bại.");
      }
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
  const handleSelectItem = (item: WmsWarehouseItem) => {
    setSelectedItem(item);
    setEcomName(item.name);
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

    const rawAttrs = item.attributes || [];

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
    setEcomImage("");
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

  const handleWmsAuthLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wmsUser.trim() || !wmsPass.trim()) {
      toast.error("Nhập đủ Username và Password WMS.");
      return;
    }
    setWmsAuthLoading(true);
    try {
      await wmsStaffLogin(wmsUser.trim(), wmsPass.trim());
      toast.success("Xác thực tài khoản WMS thành công!");
      setIsUnauthorized(false);
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Xác thực WMS thất bại.");
    } finally {
      setWmsAuthLoading(false);
    }
  };

  const handleSubmitSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !ecomName.trim() || !ecomSlug.trim() || !ecomCategoryId) {
      toast.error("Vui lòng chọn mặt hàng WMS và nhập tên sản phẩm.");
      return;
    }

    setSubmitting(true);
    try {
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

      // 4. Publish to Ecommerce
      await adminPublishProduct(productId);

      const targetCategoryObj = categories.find((c) => (c.id || c._id) === ecomCategoryId);
      const catName = targetCategoryObj ? targetCategoryObj.name : "danh mục";

      toast.success(
        `Đã tạo & duyệt sản phẩm "${ecomName}" vào danh mục "${catName}" (SKU: ${selectedItem.sku}) thành công!`,
      );

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Đẩy hàng lên Ecommerce thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCatObj = categories.find((c) => (c.id || c._id) === ecomCategoryId);
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

        {isUnauthorized ? (
          <form onSubmit={handleWmsAuthLogin} className="space-y-4 py-4">
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                <ShieldCheck className="size-4 text-amber-600" />
                <span>Xác thực tài khoản WMS Staff</span>
              </div>
              <p className="text-[11px] text-amber-700">
                Phiên làm việc WMS đã hết hạn. Vui lòng đăng nhập tài khoản Quản trị WMS để tiếp tục.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">Username WMS</Label>
              <Input
                value={wmsUser}
                onChange={(e) => setWmsUser(e.target.value)}
                className="h-10 text-xs rounded-xl font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">Password WMS</Label>
              <Input
                type="password"
                value={wmsPass}
                onChange={(e) => setWmsPass(e.target.value)}
                className="h-10 text-xs rounded-xl font-bold"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={wmsAuthLoading}
                className="h-9 w-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center gap-1.5"
              >
                {wmsAuthLoading ? <RefreshCw className="size-4 animate-spin" /> : <Building2 className="size-4" />}
                Xác Thực WMS &amp; Tiếp Tục
              </Button>
            </DialogFooter>
          </form>
        ) : loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="size-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
              <div className="text-xs text-slate-400 font-medium">Đang kết nối danh mục &amp; Kho WMS...</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitSync} className="space-y-4 pt-2">
            {/* 1. Chọn mặt hàng Kho WMS */}
            <div className="space-y-1.5 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
              <Label htmlFor="wmsItemDropdown" className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <Building2 className="size-4 text-emerald-600" />
                <span>Chọn mặt hàng</span>
              </Label>
              <select
                id="wmsItemDropdown"
                value={selectedItem?.sku || ""}
                onChange={(e) => {
                  const found = wmsItems.find((i) => i.sku === e.target.value);
                  if (found) handleSelectItem(found);
                }}
                className="h-10 w-full rounded-xl border border-emerald-300 bg-white px-3 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-none shadow-2xs cursor-pointer"
              >
                {wmsItems.map((item) => (
                  <option key={item.sku} value={item.sku}>
                    SKU: {item.sku} - {item.name} ({item.type})
                  </option>
                ))}
              </select>
            </div>

            {/* 1.5. XEM TRƯỚC & CHỈNH SỬA THÔNG SỐ VARIANT (DUNG TÍCH, KIỂU DÁNG, CHẤT LIỆU, TRỌNG LƯỢNG, XUẤT XỨ) */}
            {selectedItem && (() => {
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
