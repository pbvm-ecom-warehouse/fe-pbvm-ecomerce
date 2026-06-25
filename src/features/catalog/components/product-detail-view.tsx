"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
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
import type { CatalogProduct } from "@/types/api";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/lib/utils";

const categoryCopy: Record<CatalogProduct["category"], string> = {
  ingredient: "Nguyên liệu",
  plain_cup: "Ly chưa in",
  printed_cup: "Ly đã in",
};

function getVendorName(product: CatalogProduct) {
  if (product.slug.includes("kievit")) return "Kievit Indo";
  if (product.slug.includes("tra-den") || product.slug.includes("phuc-long")) return "Phúc Long";
  if (product.slug.includes("gia-uy")) return "Gia Uy";
  if (product.slug.includes("maulin")) return "Maulin";
  if (product.slug.includes("ly-nhua") || product.slug.includes("pet") || product.slug.includes("pp")) return "PBVM Plastic";
  return "PBVM Supplier";
}

function getProductImages(product: CatalogProduct): string[] {
  const mainImage = product.imageUrl || "/images/product-placeholder.svg";
  
  if (product.category === "ingredient") {
    return [
      mainImage,
      "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&h=400&q=80",
    ];
  } else {
    return [
      mainImage,
      "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&w=400&h=400&q=80",
      "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&h=400&q=80",
    ];
  }
}

function getProductSizes(product: CatalogProduct): string[] {
  if (product.category === "printed_cup" || product.category === "plain_cup") {
    return ["360ml", "500ml", "700ml", "1000ml"];
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

// Pseudo-random rating based on product ID to keep catalog look consistent
function getProductRating(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rating = 4.0 + (Math.abs(hash) % 11) / 10;
  const reviews = 5 + (Math.abs(hash) % 45); // 5 to 49 reviews
  return { rating, reviews };
}

export function ProductDetailView({ product }: { product: CatalogProduct }) {
  const isCustomPrint = product.fulfillmentType === "CUSTOM_PRINT";
  const hasSalePrice = product.price > product.b2bPrice;
  
  const images = useMemo(() => getProductImages(product), [product]);
  const sizes = useMemo(() => getProductSizes(product), [product]);
  const { rating, reviews } = useMemo(() => getProductRating(product.id), [product.id]);

  const [activeImage, setActiveImage] = useState(images[0]);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "vendor" | "reviews">("desc");

  // Discount percentage calculation
  const discountPercent = hasSalePrice
    ? Math.round(((product.price - product.b2bPrice) / product.price) * 100)
    : 0;

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
                  className="object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              {/* Absolute search zoom icon */}
              <button className="absolute right-4 top-4 size-8 flex items-center justify-center rounded-full bg-white border border-[#E2EDE8] text-gray-400 hover:text-[#3BB77E] shadow-sm active:scale-95 transition-all">
                <Search className="size-4" />
              </button>
            </div>

            {/* Thumbnail Row */}
            <div className="flex items-center gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
              {images.map((img, idx) => {
                const isActive = img === activeImage;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={cn(
                      "relative aspect-square size-16 rounded-xl border bg-white flex items-center justify-center p-1.5 transition-all shrink-0 cursor-pointer overflow-hidden",
                      isActive
                        ? "border-[#3BB77E] ring-2 ring-[#DEF9EC]"
                        : "border-[#E2EDE8] hover:border-[#3BB77E]/50"
                    )}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-contain" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Product Info Details (7 columns on desktop) */}
          <div className="lg:col-span-7 flex flex-col justify-start">
            {/* Hot/Sale status banner */}
            <div className="mb-3">
              <span className="bg-[#FEEFEA] text-[#FD6E6E] text-xs font-extrabold px-3 py-1 rounded-md inline-block uppercase tracking-wider">
                {isCustomPrint ? "Sale Off" : "Hot Deal"}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#253D4E] dark:text-zinc-100 leading-tight tracking-tight">
              {product.name}
            </h1>

            {/* Rating Row */}
            <div className="flex items-center gap-1.5 mt-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="size-3.5 fill-[#FDC040] text-[#FDC040]"
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground font-semibold">
                ({reviews} đánh giá từ chuỗi quán)
              </span>
            </div>

            {/* Price Block (Large) */}
            <div className="flex items-end gap-3 mt-1 pb-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex flex-col">
                {hasSalePrice && (
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#FD6E6E] mb-0.5">
                    Giá sỉ B2B
                  </div>
                )}
                <span className="text-3xl font-black text-[#3BB77E] leading-none">
                  {formatCurrency(product.b2bPrice)}
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

            {/* Sizing / Weights Row */}
            <div className="mt-6 space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Trọng lượng / Dung tích sỉ
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {sizes.map((size) => {
                  const isActive = size === selectedSize;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "text-xs font-bold px-4 py-2 rounded-lg border transition-all cursor-pointer",
                        isActive
                          ? "bg-[#3BB77E] border-[#3BB77E] text-white"
                          : "bg-[#F2F3F4] dark:bg-zinc-800 border-[#F2F3F4] dark:border-zinc-800 text-[#7E7E7E] dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      )}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions: Quantity Selector & Add Button */}
            <div className="mt-6 flex flex-wrap items-center gap-4 pb-6 border-b border-gray-100 dark:border-zinc-800">
              {/* Custom Spin quantity box */}
              <div className="flex items-center border border-[#E2EDE8] dark:border-zinc-700 rounded-lg overflow-hidden h-11 w-20 bg-white dark:bg-zinc-800 shrink-0">
                <input
                  type="number"
                  aria-label="Số lượng"
                  className="w-full text-center outline-none text-sm font-bold bg-transparent border-0"
                  value={quantity}
                  readOnly
                />
                <div className="flex flex-col border-l border-[#E2EDE8] dark:border-zinc-700 h-full justify-between w-6">
                  <button
                    className="px-1 text-[8px] hover:bg-zinc-100 dark:hover:bg-zinc-700 flex-1 border-b border-[#E2EDE8] dark:border-zinc-700 flex items-center justify-center cursor-pointer border-0 bg-transparent font-extrabold"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    ▲
                  </button>
                  <button
                    className="px-1 text-[8px] hover:bg-zinc-100 dark:hover:bg-zinc-700 flex-1 flex items-center justify-center cursor-pointer border-0 bg-transparent font-extrabold"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Add to Cart Button or Custom Print Button */}
              <div className="flex-1 min-w-[200px]">
                {isCustomPrint ? (
                  <Button
                    asChild
                    className="h-11 w-full bg-[#3BB77E] hover:bg-[#2f9565] text-white font-bold rounded-lg flex items-center justify-center gap-2 border-0 cursor-pointer text-sm shadow-none"
                  >
                    <Link href={`/design-cup?productId=${product.id}`}>
                      <Paintbrush className="size-4 mr-1" />
                      Thiết kế ly 3D ngay
                    </Link>
                  </Button>
                ) : (
                  <AddToCartButton
                    className="h-11 w-full bg-[#3BB77E] hover:bg-[#2f9565] text-white font-bold rounded-lg flex items-center justify-center gap-2 border-0 cursor-pointer text-sm shadow-none"
                    product={product}
                    quantity={quantity}
                  />
                )}
              </div>
            </div>

            {/* Meta tags detail list */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-500">Phân loại:</span>
                <span className="text-[#3BB77E] font-bold hover:underline cursor-pointer">
                  {categoryCopy[product.category]}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-gray-500">Mã hàng:</span>
                <span className="text-[#3BB77E] font-bold hover:underline cursor-pointer">
                  {product.productRefId}
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
                <span className="text-[#3BB77E] font-bold">
                  {product.stockSnapshot.toLocaleString("vi-VN")} {product.unit}
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
            <button
              onClick={() => setActiveTab("reviews")}
              className={cn(
                "px-5 py-2.5 text-xs md:text-sm font-extrabold rounded-full transition-all border cursor-pointer",
                activeTab === "reviews"
                  ? "bg-[#DEF9EC] text-[#3BB77E] border-[#BCE3C9]"
                  : "bg-transparent text-muted-foreground border-transparent hover:text-[#3BB77E] hover:border-gray-200"
              )}
            >
              Đánh giá ({reviews})
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

            {activeTab === "reviews" && (
              <div className="space-y-4 text-xs md:text-sm">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
                  <h4 className="font-extrabold text-[#253D4E] dark:text-zinc-200 text-sm">
                    Đánh giá từ khách hàng B2B ({reviews})
                  </h4>
                  <div className="flex items-center gap-1">
                    <span className="font-black text-[#253D4E] dark:text-zinc-200 text-base">{rating}</span>
                    <span className="text-muted-foreground text-xs">/ 5.0</span>
                  </div>
                </div>

                <div className="space-y-4 divide-y divide-gray-100 dark:divide-zinc-800">
                  <div className="pt-4 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#253D4E] dark:text-zinc-200">Chuỗi trà sữa Solstice Coffee</span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="size-3 fill-[#FDC040] text-[#FDC040]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground dark:text-zinc-400">
                      &ldquo;In ấn logo sắc nét chuẩn màu sắc thương hiệu. Ly PP cứng cáp, nắp dập chắc chắn không lo tràn rỉ khi ship hàng. Rất hài lòng với tồn kho realtime đặt hàng không lo đứt chuỗi.&rdquo;
                    </p>
                  </div>

                  <div className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#253D4E] dark:text-zinc-200">Đại lý Bloom MilkTea</span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="size-3 fill-[#FDC040] text-[#FDC040]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground dark:text-zinc-400">
                      &ldquo;Nguyên liệu trà lá và trân châu chất lượng chuẩn, độ nở dai ngon sần sật rất tốt. Giá sỉ B2B cực mềm so với mua lẻ ngoài chợ.&rdquo;
                    </p>
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

