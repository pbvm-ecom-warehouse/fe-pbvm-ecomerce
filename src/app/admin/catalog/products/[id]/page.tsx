"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
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
  adminPublishProduct,
  adminUploadProductImage,
  adminListProducts,
} from "@/features/catalog/services/admin-catalog.service";
import { publicApiFetch } from "@/lib/public-api";
import { formatCurrency } from "@/utils/format-currency";
import type { FulfillmentType } from "@/types/api";

const FULFILLMENT_LABELS: Record<string, string> = {
  STANDARD: "Hàng sẵn kho",
  PRINTED_TEMPLATE: "Ly đã in sẵn",
  CUSTOM_PRINT: "Hàng khách tự thiết kế",
};

export default function ProductVariantManagementPage() {
  const params = useParams();
  const router = useRouter();
  const productId = (params.id as string) || "";

  const [categories, setCategories] = useState<any[]>([]);
  const [product, setProduct] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [prodName, setProdName] = useState("");
  const [prodSlug, setProdSlug] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [isUploadingProdImage, setIsUploadingProdImage] = useState(false);

  // Variants State
  const [prodVariants, setProdVariants] = useState<
    Array<{
      id?: string;
      sku: string;
      price: number;
      availableQty: number;
      attributes: Record<string, string>;
      fulfillmentType: FulfillmentType;
    }>
  >([]);

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
      const fetchedVariants = await adminGetProductVariants(
        String(foundProd.id || foundProd._id || productId),
        foundProd.slug
      );

      const rawVars =
        fetchedVariants.length > 0
          ? fetchedVariants
          : Array.isArray(foundProd.variants) && foundProd.variants.length > 0
          ? foundProd.variants
          : [];

      if (rawVars.length > 0) {
        setProdVariants(
          rawVars.map((v: any) => ({
            id: v.id || v._id,
            sku: v.sku || (foundProd?.slug ? foundProd.slug.toUpperCase() : "SKU"),
            price: v.price !== undefined ? Number(v.price) : Number(foundProd?.price || 0),
            availableQty: v.availableQty ?? v.stockSnapshot ?? 0,
            attributes: v.attributes || {},
            fulfillmentType: v.fulfillmentType || "STANDARD",
          }))
        );
      } else {
        setProdVariants([
          {
            id: `local-var-${Date.now()}`,
            sku: (foundProd.slug || "SKU").toUpperCase(),
            price: Number(foundProd.price || 0),
            availableQty: foundProd.stockSnapshot || 0,
            attributes: foundProd.attributes || {},
            fulfillmentType: foundProd.fulfillmentType || "STANDARD",
          },
        ]);
      }
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
      const updatedSlug = prodSlug.trim().toLowerCase().replace(/\s+/g, "-");
      const imageToSave = prodImage.trim();

      // Cập nhật từng variant qua adminUpdateVariant API
      const updatedVariantsList: any[] = [];
      for (const v of prodVariants) {
        let savedVar = v;
        if (v.id && !v.id.startsWith("local-")) {
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

      toast.success(
        `Đã lưu cập nhật sản phẩm "${prodName.trim()}" & ${updatedVariantsList.length} Variant từ API CSDL!`
      );
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
      await adminPublishProduct(pId);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
        <span className="text-sm font-bold text-slate-600">
          Đang gọi API lấy danh sách Variant từ CSDL Database...
        </span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="size-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Sản phẩm không tồn tại</h2>
        <Button onClick={() => router.push("/admin/catalog/categories")}>
          <ArrowLeft className="size-4 mr-2" /> Quay lại quản lý danh mục
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-6xl mx-auto">
      {/* Navigation Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E9E3DD] shadow-2xs">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/catalog/categories")}
            className="h-9 px-3 rounded-xl border-slate-200 text-slate-700 font-bold hover:bg-slate-50 gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="size-4 text-emerald-600" />
            <span>Quay lại danh mục</span>
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
              onClick={handlePublish}
              className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs gap-1.5 cursor-pointer"
            >
              <Rocket className="size-4" />
              <span>Đưa lên kệ ngay</span>
            </Button>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md gap-2 cursor-pointer"
          >
            {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
            <span>Lưu thay đổi Variant &amp; Sản phẩm</span>
          </Button>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1: PRODUCT INFO & IMAGE */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-[#E9E3DD] shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-[#E9E3DD] py-4 bg-slate-50/50">
              <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Tag className="size-4 text-emerald-600" />
                <span>Thông tin sản phẩm</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
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
                  Slug URL *
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
                  Danh mục thuộc về *
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
                  Giá hiển thị (Tự động từ Variant thấp nhất)
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
            </CardContent>
          </Card>
        </div>

        {/* COLUMN 2 & 3: VARIANT MANAGEMENT FROM DATABASE */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl border-[#E9E3DD] shadow-sm bg-white overflow-hidden">
            <CardHeader className="border-b border-[#E9E3DD] py-4 bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="size-4 text-emerald-600" />
                  <span>Danh sách Variant từ Database CSDL ({prodVariants.length} loại)</span>
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Dữ liệu được tải trực tiếp từ API CSDL. Bạn có thể thay đổi giá bán mới cho từng Variant bên dưới.
                </CardDescription>
              </div>

              <Badge className="text-xs font-black text-emerald-800 bg-emerald-100 border-emerald-200 px-3 py-1">
                API Live Sync
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-4">
              {prodVariants.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed">
                  Không tìm thấy variant nào từ CSDL.
                </div>
              ) : (
                prodVariants.map((varItem, idx) => {
                  const attrs = varItem.attributes || {};
                  const capacityVal = attrs.capacity || attrs.size || attrs.spec || "";
                  const styleVal = attrs.style || "";
                  const materialVal = attrs.material || "";
                  const colorVal = attrs.color || "";

                  return (
                    <div
                      key={varItem.id ? `${varItem.id}-${idx}` : `variant-key-${idx}`}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all space-y-3.5 shadow-2xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-2.5">
                          <Badge className="bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-lg">
                            Variant #{idx + 1}
                          </Badge>

                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-500">SKU:</span>
                            <Input
                              value={varItem.sku}
                              onChange={(e) => handleVariantSkuChange(idx, e.target.value)}
                              className="h-8 text-xs font-mono font-bold text-slate-800 w-44 rounded-lg bg-slate-50 border-slate-200"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10.5px] font-bold text-slate-600 bg-slate-50 border-slate-200"
                          >
                            {FULFILLMENT_LABELS[varItem.fulfillmentType] || varItem.fulfillmentType}
                          </Badge>
                        </div>
                      </div>

                      {/* THÔNG SỐ TỪ CSDL DATABASE */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                            Dung tích / Size
                          </span>
                          <span className="font-bold text-slate-900">{capacityVal || "-"}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                            Kiểu dáng
                          </span>
                          <span className="font-bold text-slate-800">{styleVal || "-"}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                            Chất liệu
                          </span>
                          <span className="font-bold text-slate-800">{materialVal || "-"}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                            Tồn kho DB
                          </span>
                          <span className="font-black text-emerald-700">
                            {varItem.availableQty ?? 0} sản phẩm
                          </span>
                        </div>
                      </div>

                      {/* CHỈNH SỬA GIÁ BÁN VARIANT */}
                      <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <Label className="text-xs font-black text-emerald-800 block mb-1 uppercase tracking-wide">
                            Giá bán Variant mới (VNĐ) *
                          </Label>
                          <div className="relative max-w-sm">
                            <Input
                              type="number"
                              value={varItem.price}
                              onChange={(e) =>
                                handleVariantPriceChange(idx, Number(e.target.value))
                              }
                              className="h-10 text-sm font-black text-emerald-700 bg-emerald-50/50 border-emerald-300 focus:border-emerald-600 focus:ring-emerald-500 rounded-xl"
                              placeholder="50000"
                            />
                            <span className="absolute right-3.5 top-2.5 text-xs font-bold text-emerald-600 pointer-events-none">
                              VNĐ
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">
                            Định dạng hiển thị
                          </span>
                          <span className="text-sm font-black text-emerald-700">
                            {formatCurrency(Number(varItem.price || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/admin/catalog/categories")}
                  className="h-10 text-xs font-bold rounded-xl"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="h-10 px-5 text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {saving ? <RefreshCw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  <span>Lưu Thay Đổi Variant &amp; Sản Phẩm</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
