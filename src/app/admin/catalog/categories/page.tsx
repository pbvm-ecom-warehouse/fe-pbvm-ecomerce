"use client";

import { useEffect, useState, useMemo, useRef, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  RefreshCw,
  Folder,
  Edit2,
  Trash2,
  Search,
  Layers,
  Building2,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowLeft,
  Eye,
  Upload,
  Loader2,
  Tag,
  Image as ImageIcon,
  FolderOutput,
  RotateCcw,
  EyeOff,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { WmsSyncToEcomModal } from "@/features/catalog/components/wms-sync-to-ecom-modal";
import {
  adminListCategories,
  adminCreateCategory,
  adminUpdateCategory,
  adminDeleteCategory,
  adminListHiddenCategories,
  adminRestoreCategory,
  adminListProducts,
  adminUpdateProduct,
  adminPublishProductWithVariants,
  adminDeleteProduct,
  adminUpdateVariant,
  adminGetProductVariants,
  adminUploadProductImage,
  isApprovedCatalogProduct,
} from "@/features/catalog/services/admin-catalog.service";
import { formatCurrency } from "@/utils/format-currency";
import type { FulfillmentType } from "@/types/api";
import {
  buildCategorySubmitPayload,
  sanitizeCategorySlug,
} from "@/features/catalog/utils/category-form";

let adminCategoriesPageCache: {
  categories: any[];
  products: any[];
  hiddenCategories: any[];
} | null = null;

const FULFILLMENT_LABELS: Record<string, string> = {
  STANDARD: "Hàng sẵn kho",
  PRINTED_TEMPLATE: "Ly đã in sẵn",
  CUSTOM_PRINT: "Hàng khách tự thiết kế",
};

export default function AdminCategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, startNavigation] = useTransition();
  const viewSwitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [categoryIdFromUrl, setCategoryIdFromUrl] = useState<string | null>(
    () => searchParams.get("categoryId"),
  );
  const [isViewSwitching, setIsViewSwitching] = useState(false);
  const [categories, setCategories] = useState<any[]>(() => adminCategoriesPageCache?.categories || []);
  const [products, setProducts] = useState<any[]>(() => adminCategoriesPageCache?.products || []);
  const [loading, setLoading] = useState(!adminCategoriesPageCache);
  const [search, setSearch] = useState("");

  // Active Selected Category (null = Category Table View, categoryObj = Product List View for that category)
  const [activeCategory, setActiveCategory] = useState<any | null>(null);

  // WMS Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState(false);

  // Category Form Dialog (Add & Edit Category)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catPosition, setCatPosition] = useState(1);
  const [submittingCat, setSubmittingCat] = useState(false);

  // Product Edit Dialog
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [prodName, setProdName] = useState("");
  const [prodSlug, setProdSlug] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [isUploadingProdImage, setIsUploadingProdImage] = useState(false);

  const handleProdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          console.error("Cloudinary upload error:", err);
          setProdImage(reader.result as string);
          toast.warning("Đã lưu ảnh (dùng preview local)");
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
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodPrice, setProdPrice] = useState<number | "">(50000);
  const [prodStyle, setProdStyle] = useState("");
  const [prodSize, setProdSize] = useState("");
  const [prodMaterial, setProdMaterial] = useState("");
  const [prodColor, setProdColor] = useState("");
  const [prodFulfillment, setProdFulfillment] = useState<FulfillmentType>("STANDARD");
  const [prodVariants, setProdVariants] = useState<
    Array<{
      id?: string;
      sku: string;
      price: number;
      availableQty: number;
      attributes: Record<string, string>;
      fulfillmentType: FulfillmentType;
      image?: string | null;
    }>
  >([]);
  const [submittingProd, setSubmittingProd] = useState(false);

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

  const handleVariantSizeChange = (index: number, val: string) => {
    setProdVariants((prev) => {
      const next = [...prev];
      const updatedAttrs = { ...(next[index].attributes || {}), size: val, capacity: val };
      next[index] = { ...next[index], attributes: updatedAttrs };
      return next;
    });
  };

  const handleVariantAttrChange = (index: number, attrKey: string, val: string) => {
    setProdVariants((prev) => {
      const next = [...prev];
      const updatedAttrs = { ...(next[index].attributes || {}), [attrKey]: val };
      if (attrKey === "capacity") {
        updatedAttrs.size = val;
      }
      next[index] = { ...next[index], attributes: updatedAttrs };
      return next;
    });
  };

  const handleVariantQtyChange = (index: number, val: number) => {
    setProdVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], availableQty: val };
      return next;
    });
  };

  // Move Product Category State
  const [movingProduct, setMovingProduct] = useState<any | null>(null);
  const [targetCategoryId, setTargetCategoryId] = useState<string>("");
  const [movingLoading, setMovingLoading] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null);
  const [deletingCat, setDeletingCat] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<any | null>(null);
  const [deletingProd, setDeletingProd] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<any[]>(
    () => adminCategoriesPageCache?.hiddenCategories || [],
  );
  const [isHiddenModalOpen, setIsHiddenModalOpen] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchHiddenCategories = async () => {
    try {
      const res = await adminListHiddenCategories();
      setHiddenCategories(res || []);
    } catch (e) {
      console.error("fetchHiddenCategories error:", e);
    }
  };

  const handleRestoreCategoryConfirm = async (cat: any) => {
    const cId = cat.id || cat._id;
    if (!cId) return;

    setRestoringId(cId);
    try {
      await adminRestoreCategory(cId, cat.slug, products);
      toast.success(`Đã khôi phục danh mục "${cat.name}" thành công.`);
      await revalidateShopCache();
      await Promise.all([fetchData(), fetchHiddenCategories()]);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Khôi phục danh mục thất bại.");
    } finally {
      setRestoringId(null);
    }
  };

  // ─── Revalidate shop ecom cache sau khi CRUD danh mục ───────────────────────
  const revalidateShopCache = async () => {
    try {
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags: ["catalog-categories", "catalog-products"],
          paths: ["/", "/products", "/shop"],
        }),
      });
    } catch {
      // non-critical — don't break the flow
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, prodRes, hiddenCatRes] = await Promise.all([
        adminListCategories(),
        adminListProducts(),
        adminListHiddenCategories(),
      ]);

      const catList = catRes || [];
      const prodList = prodRes || [];
      const hiddenCatList = hiddenCatRes || [];

      setCategories(catList);
      setProducts(prodList);
      setHiddenCategories(hiddenCatList);
      adminCategoriesPageCache = {
        categories: catList,
        products: prodList,
        hiddenCategories: hiddenCatList,
      };

      // Keep activeCategory in sync if updated
      if (activeCategory) {
        const updatedCat = catList.find((c: any) => (c.id || c._id) === (activeCategory.id || activeCategory._id));
        if (updatedCat) {
          setActiveCategory(updatedCat);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Lấy dữ liệu danh mục & sản phẩm thất bại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    return () => {
      if (viewSwitchTimer.current) clearTimeout(viewSwitchTimer.current);
    };
  }, []);

  const startViewSwitch = () => {
    setIsViewSwitching(true);
    if (viewSwitchTimer.current) clearTimeout(viewSwitchTimer.current);
    viewSwitchTimer.current = setTimeout(() => {
      setIsViewSwitching(false);
    }, 140);
  };

  useEffect(() => {
    setCategoryIdFromUrl(searchParams.get("categoryId"));
  }, [searchParams]);

  useEffect(() => {
    const syncCategoryFromLocation = () => {
      startViewSwitch();
      setCategoryIdFromUrl(new URLSearchParams(window.location.search).get("categoryId"));
    };
    window.addEventListener("popstate", syncCategoryFromLocation);
    return () => window.removeEventListener("popstate", syncCategoryFromLocation);
  }, []);

  useEffect(() => {
    if (!categoryIdFromUrl) {
      if (activeCategory) setActiveCategory(null);
      return;
    }
    if (categories.length === 0) return;

    const matchedCategory = categories.find((category) => {
      const id = category.id || category._id;
      return String(id || "") === categoryIdFromUrl || String(category.slug || "") === categoryIdFromUrl;
    });

    if (matchedCategory && (activeCategory?.id || activeCategory?._id) !== (matchedCategory.id || matchedCategory._id)) {
      setActiveCategory(matchedCategory);
    }
  }, [categoryIdFromUrl, categories, activeCategory]);

  const handleBackToCategoryList = () => {
    startViewSwitch();
    setActiveCategory(null);
    setCategoryIdFromUrl(null);
    window.history.replaceState(null, "", "/admin/catalog/categories");
  };

  const handleOpenCategoryProducts = (category: any) => {
    startViewSwitch();
    setActiveCategory(category);
    const categoryId = category?.id || category?._id || category?.slug;
    if (categoryId) {
      const nextCategoryId = String(categoryId);
      setCategoryIdFromUrl(nextCategoryId);
      window.history.pushState(
        null,
        "",
        `/admin/catalog/categories?categoryId=${encodeURIComponent(nextCategoryId)}`,
      );
    }
  };

  const prefetchCategoryProducts = (category: any) => {
    // Same-page view switch: no route prefetch needed.
  };

  const getProductManagementHref = (prod: any) => {
    const targetId = prod.id || prod._id || prod.slug;
    const catId = activeCategory?.id || activeCategory?._id || prod.categoryId || prod.category?._id || prod.category?.id;
    const categoryQuery = catId ? `?categoryId=${encodeURIComponent(String(catId))}` : "";
    return `/admin/catalog/products/${encodeURIComponent(String(targetId))}${categoryQuery}`;
  };

  // Map product count per category
  const productCountByCat = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const catId = p.categoryId || p.category?._id || p.category?.id;
      if (catId) {
        counts[catId] = (counts[catId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const approvedProductCountByCat = useMemo(() => {
    const counts: Record<string, number> = {};
    products.filter(isApprovedCatalogProduct).forEach((p) => {
      const catId = p.categoryId || p.category?._id || p.category?.id;
      if (catId) {
        counts[catId] = (counts[catId] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Next auto-incremented position calculation based on existing positions
  const nextAutoPosition = useMemo(() => {
    if (!categories || categories.length === 0) return 1;
    const positions = categories.map((c) => Number(c.position || 0));
    const maxPos = Math.max(...positions, 0);
    return maxPos + 1;
  }, [categories]);

  // Filter Categories in Level 1 View
  const filteredCategories = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.slug && c.slug.toLowerCase().includes(q)),
    );
  }, [categories, search]);

  // Filter Products of active category in Level 2 View
  const categoryProducts = useMemo(() => {
    if (!activeCategory) return [];
    const catId = String(activeCategory.id || activeCategory._id || "");
    let list = products.filter((p) => {
      if (!isApprovedCatalogProduct(p)) return false;
      const pCatId = p.categoryId || p.category?._id || p.category?.id;
      return String(pCatId || "") === catId;
    });

    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter((p) => {
        const nameMatch = p.name?.toLowerCase().includes(q);
        const slugMatch = p.slug?.toLowerCase().includes(q);
        const variantMatch = p.variants?.some((v: any) => {
          const skuMatch = v.sku?.toLowerCase().includes(q);
          const sizeMatch = v.attributes?.capacity?.toLowerCase().includes(q) || v.attributes?.size?.toLowerCase().includes(q);
          const matMatch = v.attributes?.material?.toLowerCase().includes(q);
          return skuMatch || sizeMatch || matMatch;
        });
        return nameMatch || slugMatch || variantMatch;
      });
    }

    return list;
  }, [products, activeCategory, search]);

  // CATEGORY MODAL HANDLERS
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatPosition(nextAutoPosition);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setCatName(cat.name || "");
    setCatSlug(cat.slug || "");
    setCatPosition(cat.position || 1);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      toast.error("Vui lòng nhập tên danh mục.");
      return;
    }

    const sanitizeSlug = (str: string) =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "");

    const calculatedSlug = sanitizeSlug(catSlug.trim() || catName.trim());

    setSubmittingCat(true);
    try {
      const payload: {
        name: string;
        slug: string;
        position: number;
        parentId?: string | null;
      } = {
        name: catName.trim(),
        slug: calculatedSlug,
        position: Number(catPosition) || 1,
      };
      const { payload: cleanPayload } = buildCategorySubmitPayload({
        name: catName,
        slug: catSlug,
        position: catPosition,
        editingCategory,
      });
      Object.keys(payload).forEach((key) => {
        delete (payload as Record<string, any>)[key];
      });
      Object.assign(payload, cleanPayload);

      if (editingCategory) {
        const catId = editingCategory.id || editingCategory._id;
        if (!catId) {
          toast.error("Không tìm thấy ID danh mục để cập nhật.");
          return;
        }
        await adminUpdateCategory(catId, payload);
        toast.success(`Cập nhật danh mục "${catName.trim()}" thành công!`);
      } else {
        await adminCreateCategory(payload);
        toast.success(`Tạo danh mục "${catName.trim()}" (Vị trí: ${payload.position}) thành công!`);
      }

      // Revalidate shop ecom cache — hiển thị danh mục mới cho user
      await revalidateShopCache();

      setIsCategoryModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Thao tác danh mục thất bại.");
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleDeleteCategoryConfirm = async () => {
    if (!deletingCategory) return;
    const catId = deletingCategory.id || deletingCategory._id;
    const catSlug = deletingCategory.slug;

    setDeletingCat(true);
    try {
      // Truyền danh sách products & slug để service ẩn các sản phẩm và dọn dẹp cache
      const result = await adminDeleteCategory(catId, products, catSlug);
      const hiddenCount = result?.hiddenProductCount ?? 0;

      if (hiddenCount > 0) {
        toast.success(
          `Đã ẩn danh mục "${deletingCategory.name}" và ${hiddenCount} sản phẩm liên quan.`,
        );
      } else {
        toast.success(`Đã ẩn danh mục "${deletingCategory.name}" thành công.`);
      }

      if (activeCategory && (activeCategory.id || activeCategory._id) === catId) {
        setActiveCategory(null);
      }
      setDeletingCategory(null);

      // Revalidate shop ecom cache
      await revalidateShopCache();
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Ẩn danh mục thất bại.");
    } finally {
      setDeletingCat(false);
    }
  };

  const handleDeleteProductConfirm = async () => {
    if (!deletingProduct) return;
    const prodId = deletingProduct.id || deletingProduct._id;
    const prodSlug = deletingProduct.slug;
    const extraKeys = [deletingProduct.productRefId, deletingProduct.sku, deletingProduct._id, deletingProduct.id].filter(Boolean);

    setDeletingProd(true);
    try {
      await adminDeleteProduct(prodId, prodSlug, extraKeys);
      toast.success(`Đã xóa sản phẩm "${deletingProduct.name}" thành công!`);
      setDeletingProduct(null);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Xóa sản phẩm thất bại.");
    } finally {
      setDeletingProd(false);
    }
  };

  // MOVE PRODUCT CATEGORY HANDLERS
  const handleOpenMoveProduct = (prod: any) => {
    const currentCatId =
      prod.categoryId ||
      prod.category?._id ||
      prod.category?.id ||
      (activeCategory ? activeCategory.id || activeCategory._id : "");
    setMovingProduct(prod);

    const otherCat = categories.find(
      (c) => String(c.id || c._id) !== String(currentCatId),
    );
    setTargetCategoryId(otherCat ? otherCat.id || otherCat._id : currentCatId);
  };

  const handleConfirmMoveProductCategory = async () => {
    if (!movingProduct || !targetCategoryId) return;
    const prodId = movingProduct.id || movingProduct._id;
    const targetCat = categories.find(
      (c) => String(c.id || c._id) === String(targetCategoryId),
    );

    setMovingLoading(true);
    try {
      await adminUpdateProduct(prodId, { categoryId: targetCategoryId });

      setProducts((prev) =>
        prev.map((p) => {
          const pId = p.id || p._id;
          if (pId === prodId) {
            return {
              ...p,
              categoryId: targetCategoryId,
              category: targetCat || p.category,
            };
          }
          return p;
        }),
      );

      toast.success(
        `Đã chuyển sản phẩm "${movingProduct.name}" sang danh mục "${targetCat?.name || "mới"}"!`,
      );
      setMovingProduct(null);
      await revalidateShopCache();
      fetchData();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Chuyển danh mục thất bại.");
    } finally {
      setMovingLoading(false);
    }
  };

  // PRODUCT EDIT HANDLERS - Chuyển sang trang riêng quản lý Variant theo yêu cầu
  const handleOpenEditProduct = (prod: any) => {
    const href = getProductManagementHref(prod);
    startNavigation(() => {
      router.push(href);
    });
  };

  const handleProductUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !prodName.trim() || !prodSlug.trim()) {
      toast.error("Vui lòng điền đủ tên và slug sản phẩm.");
      return;
    }

    setSubmittingProd(true);
    try {
      const prodId = editingProduct.id || editingProduct._id;
      const imageToSave = prodImage.trim();
      const updatedSlug = prodSlug.trim().toLowerCase().replace(/\s+/g, "-");

      const validVariantPrices = prodVariants
        .map((v) => Number(v.price))
        .filter((pr) => !isNaN(pr) && pr > 0);
      const minVariantPrice = validVariantPrices.length > 0
        ? Math.min(...validVariantPrices)
        : (typeof prodPrice === "number" ? prodPrice : Number(prodPrice));

      // Update each variant in backend / local state
      const updatedVariantsList: any[] = [];
      for (const v of prodVariants) {
        const updatedAttributes: Record<string, string> = {
          ...(v.attributes || {}),
          ...(prodStyle.trim() ? { style: prodStyle.trim() } : {}),
          ...(prodSize.trim() ? { capacity: prodSize.trim(), size: prodSize.trim() } : {}),
          ...(prodMaterial.trim() ? { material: prodMaterial.trim() } : {}),
          ...(prodColor.trim() ? { color: prodColor.trim() } : {}),
        };

        let savedVar = v;
        if (v.id) {
          try {
            savedVar = await adminUpdateVariant(v.id, {
              sku: v.sku.trim(),
              price: Number(v.price),
              attributes: updatedAttributes,
              fulfillmentType: v.fulfillmentType || prodFulfillment,
              productId: prodId,
              image: v.image || null,
              productSlug: updatedSlug,
            });
          } catch (e) {
            console.warn("adminUpdateVariant warning:", e);
          }
        }
        updatedVariantsList.push({
          ...v,
          ...savedVar,
          sku: v.sku.trim(),
          price: Number(v.price),
          attributes: updatedAttributes,
          image: savedVar.image ?? v.image ?? null,
        });
      }

      await adminUpdateProduct(prodId, {
        name: prodName.trim(),
        slug: updatedSlug,
        description: prodDesc,
        categoryId: prodCategoryId,
        images: imageToSave ? [imageToSave] : [],
        // price và variants được update riêng qua adminUpdateVariant ở trên
        // BE UpdateProductDto không nhận 2 field này
      });

      // Cập nhật state local hiển thị ngay trên bảng Manager
      setProducts((prev) =>
        prev.map((p) => {
          const pId = p.id || p._id;
          if (pId === prodId || p.slug === editingProduct.slug) {
            return {
              ...p,
              name: prodName.trim(),
              slug: updatedSlug,
              description: prodDesc,
              categoryId: prodCategoryId,
              images: imageToSave ? [imageToSave] : p.images,
              imageUrl: imageToSave || p.imageUrl,
              price: minVariantPrice,
              variants: updatedVariantsList,
            };
          }
          return p;
        })
      );

      toast.success(`Cập nhật sản phẩm "${prodName.trim()}" & ${updatedVariantsList.length} variant thành công!`);
      setIsProductModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Cập nhật sản phẩm thất bại.");
    } finally {
      setSubmittingProd(false);
    }
  };

  const handlePublishProduct = async (id: string) => {
    try {
      await adminPublishProductWithVariants(id);
      toast.success("Đưa sản phẩm lên kệ Ecommerce thành công!");
      fetchData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Đưa sản phẩm lên kệ thất bại.");
    }
  };

  return (
    <div className="space-y-6" aria-busy={isNavigating || loading}>
      {/* Modal for WMS Sync (Duyệt & Đẩy Hàng WMS với SKU sẵn có) */}
      <WmsSyncToEcomModal
        open={showSyncModal}
        onOpenChange={setShowSyncModal}
        initialCategoryId={activeCategory ? (activeCategory.id || activeCategory._id) : undefined}
        onSuccess={fetchData}
      />

      {/* MAIN UNIFIED CARD MANAGER */}
      <Card className="rounded-2xl border-[#E9E3DD] shadow-sm bg-white overflow-hidden">
        {/* Header styling matching Product Management */}
        {!activeCategory && (
          <CardHeader className="border-b border-[#E9E3DD] py-4 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Layers className="size-4 text-emerald-600" />
                <span>Quản lý danh mục</span>
              </CardTitle>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <Button
                onClick={handleOpenCreateCategory}
                className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer text-xs font-bold border-0 shadow-sm"
              >
                <Plus className="size-3.5" />
                Thêm danh mục
              </Button>

              <Button
                onClick={() => setShowSyncModal(true)}
                variant="outline"
                className="h-9 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer text-xs font-bold"
              >
                <Building2 className="size-4 text-emerald-600" />
                Duyệt &amp; Đẩy hàng
              </Button>

              <Button
                onClick={() => {
                  fetchHiddenCategories();
                  setIsHiddenModalOpen(true);
                }}
                variant="outline"
                className="h-9 rounded-xl border border-amber-300 bg-amber-50/80 text-amber-900 hover:bg-amber-100 flex items-center gap-1.5 cursor-pointer text-xs font-bold shadow-2xs"
                title="Xem và khôi phục các danh mục đã ẩn"
              >
                <EyeOff className="size-3.5 text-amber-600" />
                <span>Danh mục đã ẩn ({hiddenCategories.length})</span>
              </Button>

              <Button
                onClick={fetchData}
                disabled={loading}
                variant="outline"
                className="h-9 rounded-xl border border-[#E9E3DD] bg-white text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer text-xs font-bold"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
            </div>
          </CardHeader>
        )}

        {/* SEARCH BAR / LEVEL 2 NAVIGATION */}
        <div
          className={`p-4 border-b border-[#E9E3DD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            activeCategory ? "bg-emerald-50/50" : "bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            {activeCategory ? (
              <>
                <Button
                  onClick={handleBackToCategoryList}
                  variant="outline"
                  className="h-8 rounded-xl bg-white text-slate-700 hover:bg-slate-100 border-slate-200 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Quay lại</span>
                </Button>
                <Badge className="bg-emerald-600 text-white text-xs font-bold py-1 px-3">
                  Danh mục: {activeCategory.name}
                </Badge>
              </>
            ) : (
              <div className="text-xs font-bold text-slate-700">
                Danh sách các danh mục
              </div>
            )}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <Input
              placeholder={activeCategory ? "Tìm sản phẩm, SKU..." : "Tìm tên danh mục, slug..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8 text-xs rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* TABLE CONTENT */}
        <CardContent
          className={`min-h-[360px] overflow-hidden p-0 transition-opacity duration-150 ease-out ${
            isViewSwitching || isNavigating ? "opacity-95" : "opacity-100"
          }`}
        >
          {loading && categories.length === 0 && products.length === 0 ? (
            <div className="flex h-64 items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-2">
                <div className="size-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
                <div className="text-xs text-slate-400 font-medium">Đang tải dữ liệu hệ thống...</div>
              </div>
            </div>
          ) : !activeCategory ? (
            /* ================= LEVEL 1: CATEGORIES TABLE ================= */
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E9E3DD] hover:bg-transparent bg-slate-50/30">
                  <TableHead className="w-[60px] font-bold text-slate-500 text-xs pl-6 text-left">#</TableHead>
                  <TableHead className="w-[32%] font-bold text-slate-500 text-xs text-left">Tên danh mục</TableHead>
                  <TableHead className="w-[26%] font-bold text-slate-500 text-xs text-left">Slug</TableHead>
                  <TableHead className="w-[15%] font-bold text-slate-500 text-xs text-left">Số sản phẩm</TableHead>
                  <TableHead className="w-[12%] font-bold text-slate-500 text-xs text-left">Vị trí hiển thị</TableHead>
                  <TableHead className="w-[150px] font-bold text-slate-500 text-xs pr-6 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-44 text-center text-xs text-slate-400 font-medium italic">
                      {search.trim() ? "Không tìm thấy danh mục nào khớp từ khóa." : "Chưa có danh mục nào. Bấm 'Thêm danh mục mới' để tạo."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((c, index) => {
                    const id = c.id || c._id;
                    const count = approvedProductCountByCat[id] || 0;

                    return (
                      <TableRow key={id} className="border-b border-[#E9E3DD]/60 hover:bg-slate-50/60 transition-colors">
                        <TableCell className="w-[60px] pl-6 py-4 text-left align-middle">
                          <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                            {index + 1}
                          </div>
                        </TableCell>
                        <TableCell
                          className="w-[32%] align-middle text-left font-extrabold text-slate-800 text-xs cursor-pointer"
                          onMouseEnter={() => prefetchCategoryProducts(c)}
                          onFocus={() => prefetchCategoryProducts(c)}
                          onClick={() => handleOpenCategoryProducts(c)}
                        >
                          <div className="flex items-center gap-2 hover:text-emerald-700 transition-colors">
                            <Folder className="size-4 text-emerald-600 shrink-0" />
                            <span className="underline decoration-slate-300 underline-offset-4">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="w-[26%] align-middle text-left text-xs">
                          <Badge variant="outline" className="font-mono text-[11px] text-slate-600 bg-slate-50 border-slate-200">
                            {c.slug}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[15%] align-middle text-left text-xs">
                          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold text-xs">
                            {count} sản phẩm
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[12%] align-middle text-left text-xs font-bold text-slate-600">
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 font-bold text-[10px]">
                            Vị trí: {c.position ?? 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="w-[150px] align-middle text-right pr-6 text-xs">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => handleOpenCategoryProducts(c)}
                              onMouseEnter={() => prefetchCategoryProducts(c)}
                              onFocus={() => prefetchCategoryProducts(c)}
                              className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer gap-1 border-0 shadow-2xs"
                              title="Xem các sản phẩm thuộc danh mục này"
                            >
                              <Eye className="size-3.5" />
                              <span>Xem sản phẩm ({count})</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenEditCategory(c)}
                              className="h-8 px-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer gap-1"
                              title="Chỉnh sửa danh mục"
                            >
                              <Edit2 className="size-3.5" />
                              <span>Sửa</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeletingCategory(c)}
                              className="hidden"
                              title="Ẩn danh mục"
                            >
                              <Trash2 className="size-3.5" />
                              <span>Ẩn</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          ) : (
            /* ================= LEVEL 2: PRODUCTS IN ACTIVE CATEGORY TABLE ================= */
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#E9E3DD] hover:bg-transparent bg-slate-50/30">
                  <TableHead className="w-[80px] font-bold text-slate-500 text-xs pl-6 text-left">Ảnh</TableHead>
                  <TableHead className="font-bold text-slate-500 text-xs text-left">Tên & Mô tả sản phẩm</TableHead>
                  <TableHead className="w-[280px] font-bold text-slate-500 text-xs text-right pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-44 text-center text-xs text-slate-400 font-medium italic">
                      {search.trim()
                        ? "Không tìm thấy sản phẩm nào khớp từ khóa trong danh mục này."
                        : `Danh mục "${activeCategory.name}" chưa có sản phẩm nào. Bấm 'Duyệt & Đẩy hàng' để chọn sản phẩm gán vào danh mục này.`}
                    </TableCell>
                  </TableRow>
                ) : (
                  categoryProducts.map((product) => {
                    const id = product.id || product._id;
                    const imgSrc = (product.images && product.images[0]) || product.imageUrl;

                    return (
                      <TableRow key={id} className="border-b border-[#E9E3DD]/60 hover:bg-slate-50/50 transition-colors">
                        {/* 1. Ảnh */}
                        <TableCell className="w-[80px] pl-6 py-3.5 text-left align-middle">
                          <div className="relative size-12 rounded-xl border bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {imgSrc ? (
                              <img src={imgSrc} alt={product.name} className="size-full object-cover" />
                            ) : (
                              <Package className="size-5 text-slate-400" />
                            )}
                          </div>
                        </TableCell>

                        {/* 2. Tên & Mô tả */}
                        <TableCell className="align-middle text-left py-3.5">
                          <div className="space-y-1">
                            <div className="text-sm font-extrabold text-slate-900 leading-tight">
                              {product.name}
                            </div>
                            {product.description && (
                              <div className="text-xs text-slate-500 font-normal line-clamp-2 max-w-2xl leading-relaxed">
                                {product.description}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* 3. Thao tác */}
                        <TableCell className="w-[280px] align-middle text-right pr-6 py-3.5 text-xs">
                          <div className="flex items-center justify-end gap-1.5">
                            {product.status === "DRAFT" && (
                              <Button
                                size="sm"
                                onClick={() => handlePublishProduct(id)}
                                className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg border-0 shadow-2xs gap-1 cursor-pointer"
                                title="Đưa sản phẩm lên kệ"
                              >
                                <Rocket className="size-3.5" />
                                <span>Lên kệ</span>
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenMoveProduct(product)}
                              className="h-8 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11.5px] font-bold rounded-lg gap-1 cursor-pointer shadow-2xs"
                              title="Chuyển sản phẩm sang danh mục khác"
                            >
                              <FolderOutput className="size-3.5 text-emerald-600" />
                              <span>Chuyển DM</span>
                            </Button>

                            <Button
                              size="sm"
                              onClick={() => handleOpenEditProduct(product)}
                              onMouseEnter={() => router.prefetch(getProductManagementHref(product))}
                              onFocus={() => router.prefetch(getProductManagementHref(product))}
                              className="h-8 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-[11.5px] font-black rounded-lg gap-1.5 cursor-pointer shadow-2xs transition-all hover:scale-105"
                              title="Bấm để tải biến thể từ DB và chỉnh sửa giá, thông số"
                            >
                              <Tag className="size-3.5 text-emerald-600" />
                              <span>Quản lý</span>
                            </Button>
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

      {/* CATEGORY FORM DIALOG (Add & Edit Category) */}
      <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white border-[#E9E3DD] p-6 shadow-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              {editingCategory ? <Edit2 className="size-4 text-emerald-600" /> : <Plus className="size-4 text-emerald-600" />}
              {editingCategory ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              {editingCategory
                ? "Cập nhật tên hiển thị, slug URL và vị trí hiển thị của danh mục."
                : "Điền tên danh mục. Slug URL sẽ tự động điền và vị trí thứ tự sẽ tự động tăng."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCategorySubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="catNameInput" className="text-xs font-bold text-slate-600">Tên danh mục *</Label>
              <Input
                id="catNameInput"
                value={catName}
                onChange={(e) => {
                  setCatName(e.target.value);
                  setCatSlug(
                    e.target.value
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/đ/g, "d")
                      .replace(/[^a-z0-9\s-]/g, "")
                      .trim()
                      .replace(/\s+/g, "-"),
                  );
                  if (editingCategory) {
                    setCatSlug(catSlug);
                  }
                }}
                placeholder="VD: Ly chưa in"
                className="h-10 text-xs rounded-xl font-semibold"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="catSlugInput" className="text-xs font-bold text-slate-600">Slug *</Label>
              <Input
                id="catSlugInput"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                placeholder="ly-chua-in"
                className="h-10 text-xs rounded-xl font-mono text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="catPositionInput" className="text-xs font-bold text-slate-600">Thứ tự</Label>
              <Input
                id="catPositionInput"
                type="number"
                value={catPosition}
                onChange={(e) => setCatPosition(Number(e.target.value))}
                placeholder="1"
                className="h-10 text-xs rounded-xl font-bold"
              />
            </div>

            <DialogFooter className="pt-3 border-t flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCategoryModalOpen(false)}
                className="h-9 text-xs font-bold rounded-xl"
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={submittingCat}
                className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 border-0 shadow-sm"
              >
                {submittingCat ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-3.5" />
                )}
                {editingCategory ? "Lưu Thay Đổi" : "Tạo Danh Mục"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CATEGORY CONFIRM DIALOG */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent className="max-w-sm rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-sm font-black text-rose-950 uppercase tracking-wider flex items-center gap-2">
              <Trash2 className="size-4 text-rose-600" />
              Xác nhận ẩn danh mục
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 leading-relaxed">
              Danh mục{" "}
              <span className="font-black text-rose-900">&quot;{deletingCategory?.name}&quot;</span>{" "}
              sẽ bị ẩn khỏi shop. Dữ liệu vẫn được giữ lại trong hệ thống.
            </DialogDescription>
          </DialogHeader>

          {/* Warning if category has products */}
          {deletingCategory && (productCountByCat[deletingCategory.id || deletingCategory._id] || 0) > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Danh mục này có{" "}
                <b>{productCountByCat[deletingCategory.id || deletingCategory._id]} sản phẩm</b>.
                {" "}Tất cả sản phẩm trong danh mục cũng sẽ <b>bị ẩn</b> khỏi shop.
              </span>
            </div>
          )}

          <DialogFooter className="flex gap-2 justify-end pt-2">
            <Button
              type="button"
              variant="ghost"
              disabled={deletingCat}
              onClick={() => setDeletingCategory(null)}
              className="h-9 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 cursor-pointer"
            >
              Quay lại
            </Button>
            <Button
              type="button"
              onClick={handleDeleteCategoryConfirm}
              disabled={deletingCat}
              className="h-9 bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 font-bold text-xs cursor-pointer shadow-md border-0"
            >
              {deletingCat ? (
                <><RefreshCw className="size-3.5 animate-spin mr-1.5" /> Đang ẩn...</>
              ) : (
                <><Trash2 className="size-3.5 mr-1.5" /> Xác nhận ẩn
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PRODUCT EDIT FORM DIALOG */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white border-[#E9E3DD] p-6 shadow-2xl">
          {(() => {
            const selectedProdCatObj = categories.find((c) => (c.id || c._id) === prodCategoryId);
            const isProdMaterial =
              editingProduct?.category === "ingredient" ||
              editingProduct?.category === "nguyen-lieu" ||
              selectedProdCatObj?.slug === "ingredient" ||
              selectedProdCatObj?.slug === "nguyen-lieu" ||
              selectedProdCatObj?.name?.toLowerCase().includes("nguyên liệu") ||
              selectedProdCatObj?.name?.toLowerCase().includes("trà");

            return (
              <>
                <DialogHeader className="border-b pb-3">
                  <DialogTitle className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Edit2 className="size-4 text-emerald-600" />
                    {isProdMaterial ? "Chỉnh sửa nguyên liệu" : "Chỉnh sửa loại ly / sản phẩm"}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    {isProdMaterial
                      ? "Cập nhật tên hiển thị, danh mục thuộc về, giá bán và thông số nguyên liệu."
                      : "Cập nhật tên hiển thị, danh mục thuộc về, giá bán và thông số sản phẩm."}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleProductUpdateSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="pName" className="text-xs font-bold text-slate-600">
                      {isProdMaterial ? "Tên nguyên liệu / sản phẩm *" : "Tên loại ly / sản phẩm *"}
                    </Label>
                    <Input
                      id="pName"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder={isProdMaterial ? "VD: Trà Đen Ceylon 500g" : "VD: Ly Nhựa PET 500ml Nắp Tim"}
                      className="h-10 text-xs rounded-xl font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pCat" className="text-xs font-bold text-slate-600">Danh mục thuộc về *</Label>
                      <select
                        id="pCat"
                        value={prodCategoryId}
                        onChange={(e) => setProdCategoryId(e.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 font-bold focus:border-emerald-500 focus:outline-none"
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

                    <div className="space-y-1.5">
                      <Label htmlFor="pPrice" className="text-xs font-bold text-slate-600">Giá bán sản phẩm (Tự động từ Variant thấp nhất)</Label>
                      <Input
                        id="pPrice"
                        disabled
                        value={(() => {
                          const validPrices = prodVariants.map((v) => Number(v.price)).filter((pr) => !isNaN(pr) && pr > 0);
                          const minVal = validPrices.length > 0 ? Math.min(...validPrices) : (typeof prodPrice === "number" ? prodPrice : 0);
                          return formatCurrency(minVal);
                        })()}
                        className="h-10 text-xs rounded-xl font-black text-slate-500 bg-slate-100 cursor-not-allowed border-slate-200"
                      />
                    </div>
                  </div>

                  {/* PHẦN CHỈNH SỬA GIÁ TỪNG VARIANT TỪ DATABASE (THÔNG SỐ KHÓA READ-ONLY) */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="size-3.5 text-emerald-600" />
                        Danh sách
                      </Label>
                      <Badge className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border-emerald-200">
                        Thông số
                      </Badge>
                    </div>

                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                      {isLoadingVariants ? (
                        <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <Loader2 className="size-4 animate-spin text-emerald-600" />
                          <span>Đang tải</span>
                        </div>
                      ) : prodVariants.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-400 font-medium">
                          Chưa có variant nào cho sản phẩm này.
                        </div>
                      ) : (
                        prodVariants.map((varItem, idx) => {
                          const attrs = varItem.attributes || {};
                          const capacityVal = attrs.capacity || attrs.size || attrs.spec || "";
                          const styleVal = attrs.style || "";
                          const materialVal = attrs.material || "";
                          const colorVal = attrs.color || "";

                          return (
                            <div key={varItem.id ? `${varItem.id}-${idx}` : `variant-key-${idx}`} className="p-3 rounded-2xl bg-white border border-slate-200/90 space-y-3 text-xs shadow-2xs">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5">
                                    Variant #{idx + 1}
                                  </Badge>
                                  <span className="font-mono text-[11px] font-bold text-slate-700">Mã SKU: {varItem.sku}</span>
                                </div>
                              </div>

                              {/* KHU VỰC THÔNG SỐ TỪ DB (READ-ONLY) */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-[11px]">
                                <div>
                                  <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Dung tích</span>
                                  <span className="font-bold text-slate-800">{capacityVal || "-"}</span>
                                </div>
                                <div>
                                  <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Kiểu dáng</span>
                                  <span className="font-semibold text-slate-700">{styleVal || "-"}</span>
                                </div>
                                <div>
                                  <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Chất liệu</span>
                                  <span className="font-semibold text-slate-700">{materialVal || "-"}</span>
                                </div>
                                <div>
                                  <span className="text-[9.5px] font-bold text-slate-400 block uppercase">Tồn kho</span>
                                  <span className="font-bold text-slate-800">{varItem.availableQty ?? 0} sp</span>
                                </div>
                              </div>

                              {/* Ô CHỈNH SỬA GIÁ BÁN VARIANT (EDITABLE) */}
                              <div className="pt-1">
                                <Label className="text-[11px] font-extrabold text-emerald-800 block mb-1 uppercase tracking-wide">
                                  Giá bán Variant mới (VNĐ) *
                                </Label>
                                <div className="relative">
                                  <Input
                                    type="number"
                                    value={varItem.price}
                                    onChange={(e) => handleVariantPriceChange(idx, Number(e.target.value))}
                                    className="h-10 text-xs font-black text-emerald-700 bg-emerald-50/40 border-emerald-300 focus:border-emerald-600 focus:ring-emerald-500 rounded-xl"
                                    placeholder="50000"
                                  />
                                  <span className="absolute right-3 top-2.5 text-xs font-bold text-emerald-600 pointer-events-none">
                                    VNĐ
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        }))}
                    </div>
                  </div>

                  {/* Hình ảnh sản phẩm (Upload từ máy) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Hình ảnh sản phẩm (Chọn ảnh từ máy)</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative size-16 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center group shadow-2xs">
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
                          id="prod-edit-image-upload"
                          accept="image/*"
                          onChange={handleProdFileUpload}
                          disabled={isUploadingProdImage}
                          className="hidden"
                        />
                        <label
                          htmlFor="prod-edit-image-upload"
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold cursor-pointer transition-colors"
                        >
                          <Upload className="size-4 text-emerald-600" />
                          <span>{prodImage ? "Thay đổi ảnh" : "Tải ảnh lên"}</span>
                        </label>
                        <p className="text-[11px] text-slate-400 font-medium">
                          Tải ảnh trực tiếp từ máy tính (Tự động upload lên Cloudinary & lưu URL)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pDesc" className="text-xs font-bold text-slate-600">Mô tả sản phẩm</Label>
                    <Textarea
                      id="pDesc"
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      rows={2}
                      placeholder="Mô tả sản phẩm..."
                      className="text-xs rounded-xl"
                    />
                  </div>

                  <DialogFooter className="pt-3 border-t flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsProductModalOpen(false)}
                      className="h-9 text-xs font-bold rounded-xl"
                    >
                      Hủy bỏ
                    </Button>
                    <Button
                      type="submit"
                      disabled={submittingProd}
                      className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 border-0 shadow-sm"
                    >
                      {submittingProd ? <RefreshCw className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                      Lưu Thay Đổi
                    </Button>
                  </DialogFooter>
                </form>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border-rose-200 p-6 shadow-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base font-black text-rose-700 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="size-5 text-rose-600" />
              Xác nhận ẩn danh mục
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 mt-1">
              Danh mục <strong className="text-slate-900">&quot;{deletingCategory?.name}&quot;</strong> và tất cả sản phẩm trong danh mục sẽ bị <strong>ẩn khỏi shop</strong>. Dữ liệu vẫn được lưu lại trong hệ thống.
            </DialogDescription>
          </DialogHeader>

          {deletingCategory && (productCountByCat[deletingCategory.id || deletingCategory._id] || 0) > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2.5 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <b>{productCountByCat[deletingCategory.id || deletingCategory._id]} sản phẩm</b>{" "}
                trong danh mục này cũng sẽ bị ẩn.
              </span>
            </div>
          )}

          <DialogFooter className="pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingCategory(null)}
              className="h-9 text-xs font-bold rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={deletingCat}
              onClick={handleDeleteCategoryConfirm}
              className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5"
            >
              {deletingCat ? <RefreshCw className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Xác Nhận Ẩn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE PRODUCT CONFIRMATION DIALOG */}
      <Dialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border-rose-200 p-6 shadow-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base font-black text-rose-700 uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="size-5 text-rose-600" />
              Xác nhận xóa sản phẩm
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 mt-1">
              Bạn có chắc chắn muốn xóa sản phẩm <strong className="text-slate-900">&quot;{deletingProduct?.name}&quot;</strong> khỏi danh mục này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingProduct(null)}
              className="h-9 text-xs font-bold rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={deletingProd}
              onClick={handleDeleteProductConfirm}
              className="h-9 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl flex items-center gap-1.5"
            >
              {deletingProd ? <RefreshCw className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              Xác Nhận Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MOVE PRODUCT CATEGORY DIALOG */}
      <Dialog open={!!movingProduct} onOpenChange={(open) => !open && setMovingProduct(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FolderOutput className="size-4 text-emerald-600" />
              Chuyển sản phẩm sang danh mục khác
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Chọn danh mục mới cho sản phẩm <strong className="text-slate-900">&quot;{movingProduct?.name}&quot;</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Danh mục hiện tại</Label>
              <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-2.5 rounded-xl flex items-center gap-2 border border-slate-200/80">
                <Folder className="size-3.5 text-slate-500" />
                <span>
                  {categories.find(
                    (c) =>
                      String(c.id || c._id) ===
                      String(
                        movingProduct?.categoryId ||
                          movingProduct?.category?._id ||
                          movingProduct?.category?.id ||
                          (activeCategory ? activeCategory.id || activeCategory._id : ""),
                      ),
                  )?.name || "Chưa phân loại"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="targetCatSelect" className="text-xs font-bold text-slate-700">
                Chuyển sang danh mục mới *
              </Label>
              <select
                id="targetCatSelect"
                value={targetCategoryId}
                onChange={(e) => setTargetCategoryId(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 font-bold focus:border-emerald-500 focus:outline-none"
              >
                {categories.map((c) => {
                  const cId = c.id || c._id;
                  const currentCatId =
                    movingProduct?.categoryId ||
                    movingProduct?.category?._id ||
                    movingProduct?.category?.id ||
                    (activeCategory ? activeCategory.id || activeCategory._id : "");
                  const isCurrent = String(cId) === String(currentCatId);
                  return (
                    <option key={cId} value={cId} disabled={isCurrent}>
                      {c.name} {isCurrent ? "(Danh mục hiện tại)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              disabled={movingLoading}
              onClick={() => setMovingProduct(null)}
              className="h-9 text-xs font-bold rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="button"
              disabled={movingLoading || !targetCategoryId}
              onClick={handleConfirmMoveProductCategory}
              className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center gap-1.5 border-0 shadow-sm"
            >
              {movingLoading ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <FolderOutput className="size-3.5" />
              )}
              Xác Nhận Chuyển
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HIDDEN CATEGORIES MODAL */}
      <Dialog open={isHiddenModalOpen} onOpenChange={setIsHiddenModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <EyeOff className="size-4 text-amber-600" />
              Danh mục đã ẩn ({hiddenCategories.length})
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Bấm &quot;Khôi phục&quot; để hiển thị lại danh mục và các sản phẩm thuộc danh mục này.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {hiddenCategories.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium italic">
                Không có danh mục nào đang bị ẩn.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {hiddenCategories.map((cat) => {
                  const cId = cat.id || cat._id;
                  const isRestoring = restoringId === cId;

                  return (
                    <div key={cId} className="py-3 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="text-xs font-black text-slate-800 flex items-center gap-2">
                          <Folder className="size-4 text-amber-600 shrink-0" />
                          <span>{cat.name}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          slug: {cat.slug}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={isRestoring}
                        onClick={() => handleRestoreCategoryConfirm(cat)}
                        className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs gap-1.5 cursor-pointer border-0"
                      >
                        {isRestoring ? (
                          <RefreshCw className="size-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="size-3.5" />
                        )}
                        <span>Khôi phục</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsHiddenModalOpen(false)}
              className="h-9 text-xs font-bold rounded-xl"
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
