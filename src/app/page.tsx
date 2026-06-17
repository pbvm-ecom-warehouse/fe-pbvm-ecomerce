import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star, Clock, ShieldCheck, BadgePercent, ChevronRight, Paintbrush } from "lucide-react";

import { cn } from "@/lib/utils";
import { CatalogGrid } from "@/features/catalog/components/catalog-grid";
import { listCatalogProducts } from "@/features/catalog/services/catalog.service";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/utils/format-currency";

function getProductThumbnail(name: string): string {
  const lowercase = name.toLowerCase();
  if (lowercase.includes("bột kem") || lowercase.includes("bột sữa") || lowercase.includes("kievit")) {
    return "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=120&h=120&q=80";
  }
  if (lowercase.includes("trà") || lowercase.includes("hồng trà") || lowercase.includes("ô long") || lowercase.includes("xanh")) {
    return "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=120&h=120&q=80";
  }
  if (lowercase.includes("ly") || lowercase.includes("pet") || lowercase.includes("pp") || lowercase.includes("cốc")) {
    return "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=120&h=120&q=80";
  }
  if (lowercase.includes("trân châu") || lowercase.includes("topping")) {
    return "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=120&h=120&q=80";
  }
  if (lowercase.includes("siro") || lowercase.includes("đường") || lowercase.includes("nước đường") || lowercase.includes("fructose")) {
    return "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=120&h=120&q=80";
  }
  if (lowercase.includes("màng dập")) {
    return "https://images.unsplash.com/photo-1582284540020-8acae03f41e4?auto=format&fit=crop&w=120&h=120&q=80";
  }
  return "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=120&h=120&q=80";
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
      title: "Thùng 1000 Ly nhựa PP 500ml dày dặn chuyên trà sữa",
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
  ];

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
    <div className="flex flex-col min-h-screen bg-[#FAF8F6] dark:bg-[#1C1816]">
      {/* Section 1: Premium Hero Banner (Full-width image background with overlay) */}
      <section className="relative overflow-hidden min-h-[500px] flex items-center py-12 md:py-16">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero-bg.png"
            alt="Premium printed cups packaging background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent dark:from-black/95 dark:via-black/75 dark:to-transparent" />
        </div>

        <div className="container mx-auto px-4 lg:px-8 max-w-7xl relative z-10">
          <div className="max-w-3xl space-y-6 text-white">
            <div className="inline-block text-[11px] font-mono tracking-[0.25em] uppercase text-[#D7C4B7] font-bold">
              Bao bì & Nguyên liệu B2B
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
              Nâng tầm thương hiệu <br />
              <span className="text-[#D7C4B7] italic">trà sữa của bạn</span>
            </h1>
            <p className="text-base text-zinc-300 leading-relaxed max-w-[55ch]">
              PBVM cung cấp ly nhựa in logo cao cấp và nguyên liệu trà sữa sỉ trực tiếp cho chuỗi cửa hàng.
              Bạn cũng có thể tự thiết kế logo lên ly nhựa trực quan với mô hình 3D tương tác.
            </p>

            <div className="pt-2 flex flex-col md:flex-row flex-wrap gap-4 items-stretch md:items-center">

              <Link href="/design-cup" className="md:w-auto">
                <Button className="w-full border border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/40 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-[0.98] h-full flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md">
                  <Paintbrush className="size-4 text-[#D7C4B7]" /> Tự thiết kế ly 3D
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-zinc-300 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[#D7C4B7]" /> Cam kết chất lượng
              </span>
              <span className="flex items-center gap-1.5">
                <BadgePercent className="size-4 text-[#D7C4B7]" /> Chiết khấu sỉ tới 15%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: Categories Bento Grid */}
      <section className="py-6 md:py-8 bg-[#FAF8F6] dark:bg-[#1C1816]">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="mb-4">
            <div className="inline-block text-[11px] font-mono tracking-[0.2em] uppercase text-primary dark:text-[#D7C4B7] font-bold mb-2">
              Danh mục B2B
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1C1917] dark:text-[#FAF8F6]">
              Sản phẩm tuyển chọn
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[240px] md:auto-rows-[220px]">
            {/* Tile 1: Ly nhựa đã in ấn (md:col-span-2 md:row-span-2) */}
            <div className="md:col-span-2 md:row-span-2 relative group overflow-hidden rounded-2xl border border-[#E6DFD9]/60 dark:border-[#3D3531]/60 flex flex-col justify-between p-8 shadow-sm hover:shadow-lg transition-all duration-300">
              <Image
                src="https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&w=800&q=80"
                alt="Ly nhựa đã in ấn"
                fill
                className="object-cover absolute inset-0 group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" />

              <div className="z-20 self-end text-white/90">
                <span className="inline-block px-2.5 py-0.5 text-[9px] font-bold tracking-widest uppercase bg-primary dark:bg-[#D7C4B7] dark:text-[#1C1816] rounded-full text-white mb-2">Bán chạy nhất</span>
              </div>
              <div className="z-20 mt-auto text-white">
                <h3 className="text-xl md:text-2xl font-extrabold mb-1">Ly nhựa đã in ấn</h3>
                <p className="text-xs text-white/80 max-w-[40ch] mb-4">Mẫu mã đa dạng, in logo sắc nét với công nghệ hiện đại.</p>
                <Link href="/products?category=printed_cup">
                  <Button className="bg-white hover:bg-[#FDFBF7] text-primary dark:bg-[#352E2A] dark:text-[#EFEAE4] dark:hover:bg-[#3D3531] font-bold text-xs px-4 h-9 rounded-lg flex items-center gap-1 active:scale-[0.98] transition-all cursor-pointer">
                    Xem bảng giá in <ArrowRight className="size-3" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Tile 2: Nguyên liệu trà sữa (md:col-span-1 md:row-span-1) */}
            <div className="md:col-span-1 md:row-span-1 bg-[#F5EFEB] dark:bg-[#2D2622] relative group overflow-hidden rounded-2xl border border-[#E6DFD9]/60 dark:border-[#3D3531]/60 flex flex-col justify-between p-6 shadow-sm hover:shadow-lg transition-all duration-300">
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
                  <h3 className="text-sm md:text-base font-extrabold text-[#3C2F2F] dark:text-[#EFEAE4]">Nguyên liệu trà sữa</h3>
                  <p className="text-[10px] text-[#7A6F68] dark:text-[#A59890] mt-1">Trân châu, thạch boba, siro chất lượng.</p>
                </div>
                <Link href="/products?category=ingredient" className="text-xs font-bold text-primary dark:text-[#D7C4B7] hover:underline flex items-center gap-0.5 mt-2">
                  Khám phá sỉ <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Tile 3: Ly nhựa chưa in (md:col-span-1 md:row-span-1) */}
            <div className="md:col-span-1 md:row-span-1 bg-[#EADEC9]/30 dark:bg-[#3D3531]/30 relative group overflow-hidden rounded-2xl border border-[#E6DFD9]/60 dark:border-[#3D3531]/60 flex flex-col justify-between p-6 shadow-sm hover:shadow-lg transition-all duration-300">
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
                  <h3 className="text-sm md:text-base font-extrabold text-[#2F2525] dark:text-[#EFEAE4]">Ly nhựa chưa in</h3>
                  <p className="text-[10px] text-[#7A6F68] dark:text-[#A59890] mt-1">Thùng ly trơn PP, PET đủ kích cỡ.</p>
                </div>
                <Link href="/products?category=plain_cup" className="text-xs font-bold text-primary dark:text-[#D7C4B7] hover:underline flex items-center gap-0.5 mt-2">
                  Xem sản phẩm <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Tile 4: Bột sữa & Kem béo (md:col-span-1 md:row-span-1) */}
            <div className="md:col-span-1 md:row-span-1 bg-[#EFEAE4] dark:bg-[#25201D] relative group overflow-hidden rounded-2xl border border-[#E6DFD9]/60 dark:border-[#3D3531]/60 flex flex-col justify-between p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-80 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80"
                  alt="Bột sữa & Kem béo"
                  fill
                  className="object-contain object-right-bottom p-2"
                />
              </div>
              <div className="z-10 max-w-[60%] flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-sm md:text-base font-extrabold text-[#3C2F2F] dark:text-[#EFEAE4]">Bột sữa & Kem béo</h3>
                  <p className="text-[10px] text-[#7A6F68] dark:text-[#A59890] mt-1">Bao 25kg, độ béo ngậy chuẩn vị.</p>
                </div>
                <Link href="/products?category=ingredient" className="text-xs font-bold text-primary dark:text-[#D7C4B7] hover:underline flex items-center gap-0.5 mt-2">
                  Bảng giá sỉ <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {/* Tile 5: Trà lá & Topping (md:col-span-2 md:row-span-1) */}
            <div className="md:col-span-2 md:row-span-1 relative group overflow-hidden rounded-2xl border border-[#E6DFD9]/60 dark:border-[#3D3531]/60 flex flex-col justify-between p-6 shadow-sm hover:shadow-lg transition-all duration-300">
              <Image
                src="https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=800&q=80"
                alt="Trà lá & Topping"
                fill
                className="object-cover absolute inset-0 group-hover:scale-102 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent z-10" />

              <div className="z-20 mt-auto text-white">
                <h3 className="text-base md:text-lg font-extrabold">Trà lá & Topping đặc sản</h3>
                <p className="text-xs text-white/80 max-w-[50ch] mt-1">Hồng trà, Trà xanh Thái Nguyên, Ô Long tuyển lựa kỹ càng.</p>
                <Link href="/products?category=ingredient" className="inline-block text-xs font-bold text-white hover:underline mt-2 flex items-center gap-0.5">
                  Đặt hàng sỉ ngay <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Daily Deals Spotlight */}
      <section className="py-6 md:py-8 bg-[#FAF8F6]/30 dark:bg-[#1C1816]/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-4">
            <div>
              <div className="inline-block text-[11px] font-mono tracking-[0.2em] uppercase text-primary dark:text-[#D7C4B7] font-bold mb-2">
                Ưu đãi có hạn
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#1C1917] dark:text-[#FAF8F6]">
                Daily Deals Spotlight
              </h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#7A6F68] dark:text-[#A59890] font-semibold">
              <Clock className="size-4 text-primary dark:text-[#D7C4B7] animate-pulse" /> Đang diễn ra hôm nay
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {deals.slice(0, 3).map((deal, idx) => (
              <div key={idx} className="bg-white dark:bg-[#25201D] border border-[#E6DFD9]/60 dark:border-[#3D3531]/60 rounded-3xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all duration-300 group">
                {/* Image Container */}
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-transparent mb-5 border border-[#E6DFD9]/20 dark:border-[#3D3531]/20">
                  <Image
                    src={deal.image}
                    alt={deal.title}
                    fill
                    className="object-cover group-hover:scale-103 transition-transform duration-500"
                  />

                  {/* Glassmorphism Countdown Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 bg-white/20 dark:bg-[#1C1816]/40 backdrop-blur-md border border-white/20 dark:border-white/10 text-white py-2 px-3 rounded-xl flex items-center justify-between text-[11px] font-bold shadow-md">
                    <span className="text-white/80 font-mono tracking-wider uppercase text-[9px]">Kết thúc sau</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>{deal.days}d</span>
                      <span className="opacity-50">:</span>
                      <span>{deal.hours}h</span>
                      <span className="opacity-50">:</span>
                      <span>{deal.mins}m</span>
                      <span className="opacity-50">:</span>
                      <span className="text-accent dark:text-[#D7C4B7]">{deal.secs}s</span>
                    </div>
                  </div>
                </div>

                {/* Product Details */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-[#7A6F68] dark:text-[#A59890] font-bold tracking-wider uppercase mb-1.5">
                      <span>{deal.category}</span>
                      <span className="text-primary dark:text-[#D7C4B7] font-bold">{deal.vendor}</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-[#1C1917] dark:text-white leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary dark:group-hover:text-[#D7C4B7] transition-colors">
                      <Link href={`/products/${deal.slug}`}>{deal.title}</Link>
                    </h3>
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-[#7A6F68] dark:text-[#A59890]">
                      <Star className="size-3.5 fill-[#D2B48C] text-[#D2B48C]" />
                      <span className="font-semibold">{deal.rating}</span>
                      <span className="opacity-50">|</span>
                      <span className="text-primary dark:text-[#D7C4B7] font-semibold">Đã bán {(deal.title.length * 3) % 100}+</span>
                    </div>
                  </div>

                  {/* Pricing & Add to Cart */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#E6DFD9]/40 dark:border-[#3D3531]/40">
                    <div>
                      <div className="text-lg font-extrabold text-primary dark:text-[#D7C4B7]">
                        {formatCurrency(deal.price)}
                      </div>
                      <div className="text-xs text-[#7A6F68] dark:text-[#A59890] line-through">
                        {formatCurrency(deal.oldPrice)}
                      </div>
                    </div>
                    <Link href={`/products/${deal.slug}`}>
                      <Button className="bg-[#EADEC9]/30 hover:bg-primary text-primary hover:text-white dark:bg-[#3D3531]/50 dark:text-[#EFEAE4] dark:hover:bg-primary dark:hover:text-[#1C1816] font-bold text-xs h-9 px-4 rounded-xl transition-all active:scale-[0.98] cursor-pointer">
                        Mua ngay
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Standard Catalog Products Grid */}
      <section className="py-6 md:py-8 bg-[#FAF8F6]/30 dark:bg-[#1C1816]/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <CatalogGrid
            products={featuredProducts}
            title="Sản phẩm B2B bán chạy nhất"
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
                      <div className="relative size-12 rounded-lg overflow-hidden shrink-0 bg-[#EFEAE4] dark:bg-[#25201D] border border-[#E6DFD9]/40 dark:border-[#3D3531]/40">
                        <img
                          src={getProductThumbnail(item.name)}
                          alt={item.name}
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      {/* Text details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#1C1917] dark:text-white truncate group-hover:text-primary dark:group-hover:text-[#D7C4B7] transition-colors">
                          {item.name}
                        </h4>
                        <div className="flex items-baseline gap-1.5 mt-0.5">
                          <span className="text-xs font-extrabold text-primary dark:text-[#D7C4B7]">
                            {item.price}
                          </span>
                          {item.oldPrice && (
                            <span className="text-[10px] text-[#7A6F68] dark:text-[#A59890] line-through">
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
