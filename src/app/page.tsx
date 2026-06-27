import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  ChevronRight,
  Clock,
  Paintbrush,
  ShieldCheck,
  Star,
} from "lucide-react";

import { listCatalogProducts } from "@/features/catalog/services/catalog.service";
import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/features/catalog/components/catalog-grid";
import { AddToCartButton } from "@/features/catalog/components/add-to-cart-button";
import { formatCurrency } from "@/utils/format-currency";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/types/api";

function getProductThumbnail(name: string): string {
  const lowercase = name.toLowerCase();
  if (lowercase.includes("bột kem") || lowercase.includes("bột sữa") || lowercase.includes("kievit")) {
    return "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=120&h=120&q=80";
  }
  if (lowercase.includes("trà") || lowercase.includes("hồng trà") || lowercase.includes("ô long") || lowercase.includes("xanh")) {
    return "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=120&h=120&q=80";
  }
  if (lowercase.includes("ly") || lowercase.includes("nhựa") || lowercase.includes("cốc")) {
    return "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=120&h=120&q=80";
  }
  return "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=120&h=120&q=80";
}

export default async function HomePage() {
  const products = await listCatalogProducts();
  const featuredProducts = products.data.slice(0, 8);


  const deals = [
    {
      title: "Bột sữa Indo Kievit Vana Blanca (Bao 25kg)",
      price: 1450000,
      oldPrice: 1650000,
      rating: 4.8,
      vendor: "Kievit Indo",
      days: "02",
      hours: "14",
      mins: "20",
      secs: "45",
      image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80",
      category: "Bột sữa",
      slug: "bot-sua-indo-kievit-vana-blanca-25kg",
    },
    {
      title: "Thùng 1000 Ly nhựa PP 500ml dày dặn",
      price: 380000,
      oldPrice: 450000,
      rating: 4.6,
      vendor: "PBVM Plastic",
      days: "03",
      hours: "08",
      mins: "12",
      secs: "10",
      image: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=400&q=80",
      category: "Ly chưa in",
      slug: "ly-nhua-pp-500ml-thung-1000",
    },
    {
      title: "Hồng trà đặc biệt Phúc Long (Bao 1kg)",
      price: 120000,
      oldPrice: 150000,
      rating: 4.7,
      vendor: "Phúc Long",
      days: "01",
      hours: "18",
      mins: "45",
      secs: "00",
      image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=400&q=80",
      category: "Trà lá",
      slug: "tra-den-co-thu-bao-1kg",
    },
    {
      title: "Trân châu đen Gia Uy túi 3kg dai giòn sần sật",
      price: 65000,
      oldPrice: 75000,
      rating: 4.5,
      vendor: "Gia Uy",
      days: "04",
      hours: "11",
      mins: "30",
      secs: "15",
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
      category: "Nguyên liệu",
      slug: "tran-chau-den-gia-uy-3kg",
    },
  ];

  const getDealProduct = (slug: string, fallbackDeal: any) => {
    const realProduct = products.data.find((p) => p.slug === slug);
    if (realProduct) return realProduct;
    return {
      id: slug,
      productRefId: "DEAL-REF",
      slug: slug,
      name: fallbackDeal.title,
      category: "ingredient",
      price: fallbackDeal.oldPrice,
      b2bPrice: fallbackDeal.price,
      unit: "bao",
      stockSnapshot: 100,
      imageUrl: fallbackDeal.image,
      updatedAt: new Date().toISOString(),
    } as CatalogProduct;
  };

  const listCols = [
    {
      title: "Bán chạy nhất",
      items: [
        { name: "Bột kem béo Kievit Indo", price: "1.450.000 đ", oldPrice: "1.650.000 đ" },
        { name: "Hồng trà đặc biệt L1 (1kg)", price: "120.000 đ", oldPrice: "" },
        { name: "Ly PET 700ml dày (50 cái)", price: "28.000 đ", oldPrice: "32.000 đ" },
      ],
    },
    {
      title: "Đang là xu hướng",
      items: [
        { name: "Trà Xanh Thái Nguyên ướp nhài", price: "185.000 đ", oldPrice: "" },
        { name: "Trân châu đen Gia Uy (Bao 3kg)", price: "65.000 đ", oldPrice: "75.000 đ" },
        { name: "Nước đường Hàn Quốc (Thùng 25kg)", price: "480.000 đ", oldPrice: "520.000 đ" },
      ],
    },
    {
      title: "Mới cập nhật",
      items: [
        { name: "Ly nhựa PP nút tim 500ml", price: "45.000 đ", oldPrice: "" },
        { name: "Trà Ô Long Tứ Quý hảo hạng", price: "240.000 đ", oldPrice: "270.000 đ" },
        { name: "Siro Đường Đen Đài Loan 2.5kg", price: "195.000 đ", oldPrice: "" },
      ],
    },
    {
      title: "Đánh giá cao",
      items: [
        { name: "Đường nước High Fructose thùng", price: "420.000 đ", oldPrice: "" },
        { name: "Trà Đen Cổ Thụ chuyên trà sữa", price: "320.000 đ", oldPrice: "360.000 đ" },
        { name: "Màng dập cốc nhựa cuộn 2000 ly", price: "115.000 đ", oldPrice: "135.000 đ" },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background dark:bg-[#1C1816]">
      {/* Section 1: Premium Hero Banner (Full-width image background with overlay) */}
      <section className="relative overflow-hidden min-h-[500px] flex items-center py-12 md:py-16">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/pbvm-hero-clean.png"
            alt="Premium printed cups packaging background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent dark:from-black/95 dark:via-black/75 dark:to-transparent" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10">
          <div className="max-w-3xl space-y-6 text-white">
            <div className="inline-block text-[11px] font-mono tracking-[0.25em] uppercase text-[#3BB77E] font-bold">
              Bao bì & Nguyên liệu
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Nâng tầm thương hiệu <br />
              <span className="text-[#3BB77E] italic">trà sữa của bạn</span>
            </h1>
            <p className="text-base text-zinc-300 leading-relaxed max-w-[55ch]">
              PBVM cung cấp ly nhựa in logo cao cấp và nguyên liệu trà sữa sỉ trực tiếp cho chuỗi cửa hàng.
              Bạn cũng có thể tự thiết kế logo lên ly nhựa trực quan với mô hình 3D tương tác.
            </p>

            <div className="pt-2 flex flex-col md:flex-row flex-wrap gap-4 items-stretch md:items-center">
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-zinc-300 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[#3BB77E]" /> Cam kết chất lượng
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Categories Bento Grid */}
      <section className="py-6 md:py-8 bg-white dark:bg-[#1C1816]">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="mb-4">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1C1917] dark:text-foreground">
              Sản phẩm tuyển chọn
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[180px] md:auto-rows-[160px]">
            {/* Tile 1: Ly nhựa đã in ấn (md:col-span-2 md:row-span-2) */}
            <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-2xl border border-[#E2EDE8] dark:border-[#2C332F]/60 flex flex-col justify-between p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <Image
                src="https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&w=800&q=80"
                alt="Ly nhựa đã in ấn"
                fill
                className="object-cover absolute inset-0 group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

              <div className="z-20 self-end text-white/90">
                <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-primary dark:bg-primary dark:text-[#1C1816] rounded-full text-white mb-2">Bán chạy nhất</span>
              </div>
              <div className="z-20 mt-auto text-white">
                <h3 className="text-lg md:text-xl font-extrabold mb-1">Ly nhựa đã in ấn</h3>
                <p className="text-xs text-white/80 max-w-[40ch] mb-3">Mẫu mã đa dạng, in logo sắc nét với công nghệ hiện đại.</p>
                <Link href="/products?category=printed_cup">
                  <Button className="bg-white hover:bg-[#FDFBF7] text-primary dark:bg-[#352E2A] dark:text-[#EFEAE4] dark:hover:bg-[#3D3531] font-bold text-xs px-4 h-8 rounded-lg flex items-center gap-1 active:scale-[0.98] transition-all cursor-pointer border-0">
                    Xem bảng giá in <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Tile 2: Nguyên liệu trà sữa (md:col-span-1 md:row-span-1) */}
            <div className="md:col-span-1 md:row-span-1 bg-[#DEF9EC]/60 dark:bg-[#1b3d2f]/30 relative group overflow-hidden rounded-2xl border border-[#E2EDE8] dark:border-[#2C332F]/60 flex flex-col justify-between p-5 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-80 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=300&q=80"
                  alt="Nguyên liệu trà sữa"
                  fill
                  className="object-contain object-right-bottom p-2"
                />
              </div>
              <div className="z-10 max-w-[60%] flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-sm md:text-base font-extrabold text-[#253D4E] dark:text-[#FAF7F4]">Nguyên liệu trà sữa</h3>
                  <p className="text-[10px] text-[#7A6F68] dark:text-[#A59890] mt-1">Trân châu, thạch boba, siro chất lượng.</p>
                </div>
                <Link href="/products?category=ingredient" className="text-xs font-bold text-primary dark:text-primary hover:underline flex items-center gap-0.5 mt-2">
                  Khám phá <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Tile 3: Ly nhựa chưa in (md:col-span-1 md:row-span-1) */}
            <div className="md:col-span-1 md:row-span-1 bg-[#DEF9EC]/75 dark:bg-[#1b3d2f]/40 relative group overflow-hidden rounded-2xl border border-[#E2EDE8] dark:border-[#2C332F]/60 flex flex-col justify-between p-5 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-80 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=300&q=80"
                  alt="Ly nhựa chưa in"
                  fill
                  className="object-contain object-right-bottom p-2"
                />
              </div>
              <div className="z-10 max-w-[60%] flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-sm md:text-base font-extrabold text-[#253D4E] dark:text-[#FAF7F4]">Ly nhựa chưa in</h3>
                  <p className="text-[10px] text-[#7A6F68] dark:text-[#A59890] mt-1">Thùng ly trơn PP, PET đủ kích cỡ.</p>
                </div>
                <Link href="/products?category=plain_cup" className="text-xs font-bold text-primary dark:text-primary hover:underline flex items-center gap-0.5 mt-2">
                  Xem sản phẩm <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section 4: Daily Deals Spotlight */}
      <section className="py-6 md:py-8 bg-white dark:bg-[#1C1816]/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 gap-4 border-b border-gray-100 dark:border-zinc-800 pb-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#253D4E] dark:text-zinc-100 tracking-tight">
              Ưu đãi hôm nay
            </h2>
            <Link
              href="/products"
              className="text-sm font-bold text-[#3BB77E] hover:text-[#2F9A68] hover:translate-x-0.5 transition-all flex items-center gap-1 cursor-pointer"
            >
              All Deals <ChevronRight className="size-4" />
            </Link>
          </div>

          {/* Grid Layout */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {deals.slice(0, 4).map((deal, idx) => (
              <div
                key={idx}
                className="relative aspect-[3/4] w-full rounded-[20px] overflow-hidden border border-[#E2EDE8] dark:border-[#2C332F] bg-white dark:bg-[#1C1F1D] shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={deal.image}
                    alt={deal.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* White Inset Content Card */}
                <div className="absolute bottom-4 left-4 right-4 bg-white dark:bg-[#121d19] rounded-[20px] p-4 shadow-lg border border-gray-100/50 dark:border-zinc-800/50 flex flex-col justify-between z-10">
                  <div>
                    {/* Category */}
                    <div className="text-[9px] text-muted-foreground/80 font-bold uppercase tracking-wider mb-1">
                      {deal.category}
                    </div>
                    {/* Title */}
                    <h3 className="text-xs md:text-sm font-bold text-[#253D4E] dark:text-zinc-100 leading-snug line-clamp-2 min-h-[36px]">
                      <Link href={`/products/${deal.slug}`} className="hover:text-[#3BB77E] transition-colors">
                        {deal.title}
                      </Link>
                    </h3>
                    {/* Vendor */}
                    <div className="text-[10px] text-muted-foreground/80 dark:text-zinc-400 mt-1">
                      By <span className="text-[#3BB77E] font-bold hover:underline cursor-pointer">{deal.vendor}</span>
                    </div>
                  </div>

                  {/* Pricing & Add Button */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800/80">
                    <div className="flex flex-col">
                      <span className="text-sm md:text-base font-extrabold text-[#3BB77E]">
                        {formatCurrency(deal.price)}
                      </span>
                      <span className="text-[10px] text-muted-foreground line-through">
                        {formatCurrency(deal.oldPrice)}
                      </span>
                    </div>

                    <AddToCartButton
                      className="h-8 rounded-lg bg-[#DEF9EC] dark:bg-[#1b3d2f] hover:bg-[#3BB77E] hover:text-white text-[#3BB77E] dark:text-[#4ade80] font-bold text-xs transition-all duration-200 px-3 cursor-pointer border-0 shadow-none active:scale-[0.98]"
                      product={getDealProduct(deal.slug, deal)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Standard Catalog Products Grid */}
      <section className="py-6 md:py-8 bg-white dark:bg-[#1C1816]/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <CatalogGrid
            products={featuredProducts}
            title="Sản phẩm bán chạy nhất"
          />
        </div>
      </section>

      {/* Section 7: Curated Lists (4-column footer lists with product images) */}
      <section className="py-6 md:py-8 bg-[#FAF8F6] dark:bg-[#1C1816]">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {listCols.map((col, colIdx) => (
              <div key={colIdx} className="space-y-3">
                <h3 className="text-xs font-extrabold text-[#1C1917] dark:text-white uppercase tracking-wider pb-1">
                  {col.title}
                </h3>
                <div className="flex flex-col gap-1">
                  {col.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center gap-3 py-2 group cursor-pointer">
                      {/* Image Thumbnail */}
                      <div className="relative size-12 rounded-lg overflow-hidden shrink-0 bg-[#F0F6F3] dark:bg-[#162D21] border border-[#E2EDE8] dark:border-[#2C332F]">
                        <img
                          src={getProductThumbnail(item.name)}
                          alt={item.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      {/* Text details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#1C1917] dark:text-white truncate group-hover:text-primary dark:group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className={cn("text-xs font-extrabold", item.oldPrice ? "text-[#E74C3C]" : "text-[#253D4E]")}>
                            {item.price}
                          </span>
                          {item.oldPrice && (
                            <span className="text-[10px] text-[#253D4E]/70 line-through">
                              {item.oldPrice}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
