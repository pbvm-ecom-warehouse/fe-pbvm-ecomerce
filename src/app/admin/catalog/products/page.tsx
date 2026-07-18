"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Rocket,
  PlusCircle,
  Eye,
  RefreshCw,
  FolderPlus,
  Package,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminListProducts,
  adminCreateProduct,
  adminPublishProduct,
  adminCreateVariant,
  adminListCategories,
} from "@/features/catalog/services/admin-catalog.service";
import { formatCurrency } from "@/utils/format-currency";
import type { FulfillmentType } from "@/types/api";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showProductModal, setShowProductModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [targetProduct, setTargetProduct] = useState<any>(null);

  // New Product Form state
  const [prodName, setProdName] = useState("");
  const [prodSlug, setProdSlug] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");

  // New Variant Form state
  const [varSku, setVarSku] = useState("");
  const [varPrice, setVarPrice] = useState(0);
  const [varFulfillment, setVarFulfillment] = useState<FulfillmentType>("STANDARD");
  const [varSize, setVarSize] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodRes = await adminListProducts();
      setProducts(prodRes || []);

      const catRes = await adminListCategories();
      setCategories(catRes || []);
      if (catRes && catRes.length > 0) {
        setProdCategoryId(catRes[0].id || catRes[0]._id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Lấy danh sách dữ liệu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodSlug || !prodCategoryId) {
      toast.error("Vui lòng điền các trường bắt buộc.");
      return;
    }

    try {
      const payload = {
        name: prodName,
        slug: prodSlug.trim().toLowerCase().replace(/\s+/g, "-"),
        description: prodDesc,
        images: prodImage ? [prodImage] : ["https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80"],
        categoryId: prodCategoryId,
        status: "DRAFT",
      };

      await adminCreateProduct(payload);
      toast.success("Tạo sản phẩm nháp thành công!");
      setShowProductModal(false);

      // Reset form
      setProdName("");
      setProdSlug("");
      setProdDesc("");
      setProdImage("");

      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Tạo sản phẩm thất bại.");
    }
  };

  const handleCreateVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!varSku || varPrice <= 0 || !targetProduct) {
      toast.error("Vui lòng điền đúng thông tin biến thể.");
      return;
    }

    try {
      const attributes: Record<string, string> = {};
      if (varSize) {
        attributes.size = varSize;
      }

      const payload = {
        sku: varSku.trim().toUpperCase(),
        productId: String(targetProduct.id || targetProduct._id),
        price: Number(varPrice),
        attributes: varSize ? attributes : undefined,
        fulfillmentType: varFulfillment,
      };

      await adminCreateVariant(payload);
      toast.success("Tạo biến thể thành công!");
      setShowVariantModal(false);

      // Reset form
      setVarSku("");
      setVarPrice(0);
      setVarSize("");
      setVarFulfillment("STANDARD");
      setTargetProduct(null);

      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Tạo biến thể thất bại.");
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await adminPublishProduct(id);
      toast.success("Đưa sản phẩm lên kệ thành công!");
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Đưa sản phẩm lên kệ thất bại.");
    }
  };

  const getCategoryName = (catId: string) => {
    const cat = categories.find((c) => (c.id || c._id) === catId);
    return cat ? cat.name : "Nguyên liệu";
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-[#E9E3DD] shadow-sm bg-white overflow-hidden">
        <CardHeader className="border-b border-[#E9E3DD] py-4 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider">
              Danh sách sản phẩm
            </CardTitle>
            <CardDescription className="text-xs">
              Sản phẩm có trạng thái ACTIVE mới hiển thị công khai trên Storefront
            </CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              onClick={fetchData}
              variant="outline"
              className="h-9 rounded-xl border border-[#E9E3DD] bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer text-xs font-bold"
            >
              <RefreshCw className="size-3.5" />
              Làm mới
            </Button>
            <Button
              onClick={() => setShowProductModal(true)}
              className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer border-0 text-xs shadow-md shadow-emerald-500/10"
            >
              <Plus className="size-4" />
              Thêm sản phẩm
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-64 items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                <div className="text-xs text-slate-400 font-medium">Đang tải dữ liệu sản phẩm...</div>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E9E3DD] hover:bg-transparent">
                  <TableHead className="w-[80px] font-bold text-slate-500 text-xs">Ảnh</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs">Tên sản phẩm</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs">Danh mục</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs">Trạng thái</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs">Loại</TableHead>
                  <TableHead className="text-right font-bold text-slate-500 text-xs pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-xs text-slate-400 italic">
                      Chưa có sản phẩm nào. Bấm "Thêm sản phẩm" để bắt đầu.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const id = product.id || product._id;
                    const hasVariants = product.variants && product.variants.length > 0;

                    return (
                      <TableRow key={id} className="border-b border-[#E9E3DD]/60 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="py-4">
                          <div className="relative size-12 rounded-xl overflow-hidden bg-[#FAF8F6] border border-[#E9E3DD]/80 flex items-center justify-center p-1.5">
                            {product.images && product.images[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Package className="size-5 text-slate-400" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="font-bold text-slate-800 text-xs">{product.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{product.slug}</div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <Badge variant="secondary" className="bg-[#FAF8F6] text-slate-600 border border-[#E9E3DD]/80 text-[10px] py-0.5 px-2 rounded-full font-bold">
                            {getCategoryName(product.categoryId)}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-middle">
                          {product.status === "ACTIVE" ? (
                            <Badge className="bg-emerald-500 text-white hover:bg-emerald-600 text-[10px] py-0.5 px-2 font-bold rounded-full border-0">
                              HOẠT ĐỘNG
                            </Badge>
                          ) : product.status === "HIDDEN" ? (
                            <Badge className="bg-amber-500 text-white hover:bg-amber-600 text-[10px] py-0.5 px-2 font-bold rounded-full border-0">
                              ĐÃ ẨN
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-400 text-white hover:bg-slate-500 text-[10px] py-0.5 px-2 font-bold rounded-full border-0">
                              BẢN NHÁP
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="align-middle">
                          {hasVariants ? (
                            <div className="space-y-1.5 max-w-md">
                              {product.variants.map((v: any) => (
                                <div
                                  key={v.id || v._id}
                                  className="flex items-center justify-between text-[10px] border border-slate-100 rounded-lg p-1.5 bg-slate-50"
                                >
                                  <span className="font-bold text-slate-700 font-mono">{v.sku}</span>
                                  {v.attributes && Object.entries(v.attributes).map(([key, val]) => (
                                    <span key={key} className="text-slate-500 font-semibold bg-white border border-slate-150 px-1.5 py-0.5 rounded animate-fade-in">
                                      {key}: {String(val)}
                                    </span>
                                  ))}
                                  <span className="text-[#3BB77E] font-extrabold">{formatCurrency(v.price)}</span>
                                  <span className="text-slate-400">Tồn: <strong className="text-slate-600">{v.availableQty ?? 0}</strong></span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium italic">
                              Chưa có biến thể (Không thể bán)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="align-middle text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button
                              onClick={() => {
                                setTargetProduct(product);
                                setShowVariantModal(true);
                              }}
                              variant="outline"
                              className="h-8 rounded-lg border border-[#E9E3DD] text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                            >
                              <PlusCircle className="size-3" />
                              + SKU
                            </Button>
                            {product.status !== "ACTIVE" && (
                              <Button
                                onClick={() => handlePublish(id)}
                                className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer border-0"
                              >
                                <Rocket className="size-3" />
                                Lên kệ
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E9E3DD] shadow-2xl p-6 relative">
            <h3 className="text-base font-black text-slate-800 mb-4 uppercase tracking-wider">
              Tạo sản phẩm mới (DRAFT)
            </h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="pName" className="text-xs font-bold text-slate-500">Tên sản phẩm *</Label>
                  <Input
                    id="pName"
                    value={prodName}
                    onChange={(e) => {
                      setProdName(e.target.value);
                      // Auto generate slug
                      setProdSlug(
                        e.target.value
                          .toLowerCase()
                          .normalize("NFD")
                          .replace(/[\u0300-\u036f]/g, "")
                          .replace(/đ/g, "d")
                          .replace(/[^a-z0-9\s-]/g, "")
                          .trim()
                          .replace(/\s+/g, "-"),
                      );
                    }}
                    placeholder="VD: Trà Đen Phúc Long"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pSlug" className="text-xs font-bold text-slate-500">URL Slug (Kebab-case) *</Label>
                  <Input
                    id="pSlug"
                    value={prodSlug}
                    onChange={(e) => setProdSlug(e.target.value)}
                    placeholder="tra-den-phuc-long"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="pDesc" className="text-xs font-bold text-slate-500">Mô tả sản phẩm</Label>
                <Textarea
                  id="pDesc"
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  placeholder="Mô tả chi tiết nguyên liệu, đóng gói..."
                  className="rounded-xl text-xs resize-none h-20"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="pCategory" className="text-xs font-bold text-slate-500">Danh mục *</Label>
                  <select
                    id="pCategory"
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id || c._id} value={c.id || c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="pImage" className="text-xs font-bold text-slate-500">Link ảnh sản phẩm (URL)</Label>
                  <Input
                    id="pImage"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    placeholder="https://unsplash.com/..."
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#E9E3DD] pt-4 mt-6">
                <Button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  variant="outline"
                  className="h-10 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer border-0 text-xs"
                >
                  Tạo sản phẩm
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {showVariantModal && targetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#E9E3DD] shadow-2xl p-6 relative">
            <h3 className="text-base font-black text-slate-800 mb-2 uppercase tracking-wider">
              Tạo biến thể mới
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mb-4">
              Sản phẩm: {targetProduct.name}
            </p>
            <form onSubmit={handleCreateVariant} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="vSku" className="text-xs font-bold text-slate-500">Mã SKU (Khớp WMS) *</Label>
                <Input
                  id="vSku"
                  value={varSku}
                  onChange={(e) => setVarSku(e.target.value)}
                  placeholder="REF-TRA-02"
                  className="h-10 text-xs rounded-xl"
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="vPrice" className="text-xs font-bold text-slate-500">Giá bán (VND) *</Label>
                  <Input
                    id="vPrice"
                    type="number"
                    value={varPrice}
                    onChange={(e) => setVarPrice(Number(e.target.value))}
                    placeholder="120000"
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vSize" className="text-xs font-bold text-slate-500">Kích thước / Size</Label>
                  <Input
                    id="vSize"
                    value={varSize}
                    onChange={(e) => setVarSize(e.target.value)}
                    placeholder="M, L, 1kg, 25kg..."
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="vFulfillment" className="text-xs font-bold text-slate-500">Fulfillment Type *</Label>
                <select
                  id="vFulfillment"
                  value={varFulfillment}
                  onChange={(e) => setVarFulfillment(e.target.value as FulfillmentType)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="STANDARD">STANDARD (Hàng sẵn)</option>
                  <option value="PRINTED_TEMPLATE">PRINTED_TEMPLATE (Ly đã in sẵn)</option>
                  <option value="CUSTOM_PRINT">CUSTOM_PRINT (Hàng khách tự thiết kế)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#E9E3DD] pt-4 mt-6">
                <Button
                  type="button"
                  onClick={() => setShowVariantModal(false)}
                  variant="outline"
                  className="h-10 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer border-0 text-xs"
                >
                  Thêm biến thể
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
