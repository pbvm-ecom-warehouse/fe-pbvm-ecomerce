import Link from "next/link";
import { ArrowRight, ShoppingCart, Star, Sparkles, Paintbrush, Flame, Layers, Milk, Shirt, Bone, Cookie, Citrus, CupSoda, Leaf } from "lucide-react";

import { cn } from "@/lib/utils";
import { CatalogGrid } from "@/features/catalog/components/catalog-grid";
import { listCatalogProducts } from "@/features/catalog/services/catalog.service";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/features/catalog/components/add-to-cart-button";
import type { CatalogProduct } from "@/types/api";

export default async function HomePage() {
  const products = await listCatalogProducts();
  const featuredProducts = products.data.slice(0, 8);

  const categories = [
    { name: "Nguyên liệu trà sữa", count: "12 sản phẩm", bg: "bg-[#F5EFEB]" },
    { name: "Ly nhựa chưa in", count: "8 sản phẩm", bg: "bg-[#EADEC9]/40" },
    { name: "Ly nhựa đã in ấn", count: "6 sản phẩm", bg: "bg-[#EFEAE4]" },
    { name: "Bột sữa & Kem béo", count: "9 sản phẩm", bg: "bg-[#F5EFEB]" },
    { name: "Trà lá & Topping", count: "15 sản phẩm", bg: "bg-[#EFEAE4]" },
  ];

  const promoBanners = [
    {
      title: "Thiết kế ly miễn phí",
      desc: "Hỗ trợ thiết kế Logo phong cách riêng cho thương hiệu trà sữa của bạn.",
      btnText: "Đăng ký ngay",
      bg: "bg-gradient-to-br from-[#EFEAE4] to-[#FAF8F6]",
      textColor: "text-[#3C2F2F]",
      icon: Paintbrush,
    },
    {
      title: "Trà & Bột sữa B2B sỉ",
      desc: "Nguyên liệu cao cấp nhập khẩu sạch 100%, chiết khấu sỉ lên tới 15%.",
      btnText: "Xem bảng giá",
      bg: "bg-gradient-to-br from-primary to-[#4A2E22]",
      textColor: "text-white",
      icon: Sparkles,
    },
    {
      title: "In ấn ly nhựa hỏa tốc",
      desc: "In ly logo số lượng ít từ 1000 cái. Giao hàng hỏa tốc trong 2-3 ngày.",
      btnText: "Liên hệ in",
      bg: "bg-gradient-to-br from-[#D2B48C]/30 to-[#FAF8F6]",
      textColor: "text-[#3C2F2F]",
      icon: Layers,
    },
  ];

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
      image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80",
      category: "Bột sữa",
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
      image: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=400&q=80",
      category: "Trà lá",
    },
    {
      title: "Trân châu đen Gia Uy túi 3kg dai giòn sần sật",
      price: 65000,
      oldPrice: 75000,
      rating: 4.5,
      vendor: "Gia Uy",
      days: "04",
      hours: "02",
      mins: "10",
      secs: "55",
      image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80",
      category: "Topping",
    },
    {
      title: "Siro Đường Đen Đài Loan Maulin 2.5kg",
      price: 195000,
      oldPrice: 230000,
      rating: 4.9,
      vendor: "Maulin",
      days: "02",
      hours: "06",
      mins: "30",
      secs: "15",
      image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80",
      category: "Siro",
    },
    {
      title: "Sữa đặc Larosee Malaysia lon 1kg",
      price: 48000,
      oldPrice: 58000,
      rating: 4.4,
      vendor: "Larosee",
      days: "01",
      hours: "04",
      mins: "15",
      secs: "30",
      image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80",
      category: "Sữa đặc",
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
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar Column - Visible on desktop, stacks on mobile */}
        <aside className="w-full lg:w-[280px] shrink-0 flex flex-col gap-6 lg:sticky lg:top-24">
          {/* Category block */}
          <div className="rounded-3xl border border-[#E6DFD9] bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1C1917] border-b border-[#E6DFD9]/60 pb-2.5">Danh mục</h3>
            <div className="space-y-2.5">
              {[
                { name: "Nguyên liệu trà sữa", count: 12, icon: Milk, bg: "bg-[#F5EFEB]" },
                { name: "Ly nhựa chưa in", count: 8, icon: CupSoda, bg: "bg-[#EADEC9]/30" },
                { name: "Ly nhựa đã in ấn", count: 6, icon: Paintbrush, bg: "bg-[#EFEAE4]" },
                { name: "Bột sữa & Kem béo", count: 9, icon: Cookie, bg: "bg-[#F5EFEB]" },
                { name: "Trà lá & Topping", count: 15, icon: Leaf, bg: "bg-[#EFEAE4]" },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-xl border border-[#E6DFD9]/30 hover:border-primary/20 hover:bg-[#FAF8F6] transition-all cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className={`size-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                        <Icon className="size-5 text-primary stroke-[1.8]" />
                      </div>
                      <span className="text-xs font-semibold text-[#1C1917] group-hover:text-primary transition-colors">{item.name}</span>
                    </div>
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fill by price filter block */}
          <div className="rounded-3xl border border-[#E6DFD9] bg-white p-5 shadow-sm space-y-4 relative overflow-hidden">
            <h3 className="text-sm font-bold text-[#1C1917] border-b border-[#E6DFD9]/60 pb-2.5">Lọc theo giá</h3>
            <div className="space-y-4">
              {/* Mock Range Slider */}
              <div className="space-y-2 pt-2">
                <div className="relative h-1.5 w-full rounded-full bg-[#EFEAE4]">
                  <div className="absolute left-[20%] right-[30%] h-full bg-primary rounded-full" />
                  <div className="absolute left-[20%] top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-primary border-2 border-white shadow cursor-pointer" />
                  <div className="absolute right-[30%] top-1/2 -translate-y-1/2 size-3.5 rounded-full bg-primary border-2 border-white shadow cursor-pointer" />
                </div>
                <div className="flex justify-between text-[10px] text-[#7A6F68] font-semibold pt-1">
                  <span>Từ: <strong className="text-primary">100k đ</strong></span>
                  <span>Đến: <strong className="text-primary">2.000k đ</strong></span>
                </div>
              </div>

              {/* Brand filter */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#1C1917]">Thương hiệu sỉ</span>
                <div className="space-y-1">
                  {[
                    { label: "Phúc Long (45)", checked: true },
                    { label: "Kievit Indo (24)", checked: false },
                    { label: "Gia Uy (32)", checked: false },
                  ].map((brand, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-xs text-[#7A6F68] font-medium cursor-pointer">
                      <input type="checkbox" defaultChecked={brand.checked} className="rounded border-[#E6DFD9] text-primary focus:ring-primary size-3.5" />
                      <span>{brand.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Packaging Condition */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#1C1917]">Quy cách đóng gói</span>
                <div className="space-y-1">
                  {[
                    { label: "Bao 25kg (12)", checked: true },
                    { label: "Túi 1kg (68)", checked: false },
                    { label: "Thùng/Hộp (15)", checked: false },
                  ].map((pkg, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-xs text-[#7A6F68] font-medium cursor-pointer">
                      <input type="checkbox" defaultChecked={pkg.checked} className="rounded border-[#E6DFD9] text-primary focus:ring-primary size-3.5" />
                      <span>{pkg.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button className="w-full text-xs font-bold h-9 bg-primary text-primary-foreground hover:bg-[#4A2E22] flex gap-1.5 justify-center">
                Lọc kết quả
              </Button>
            </div>
          </div>

          {/* New products block */}
          <div className="rounded-3xl border border-[#E6DFD9] bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-[#1C1917] border-b border-[#E6DFD9]/60 pb-2.5">Sản phẩm mới</h3>
            <div className="space-y-4">
              {[
                { name: "Bột sữa Kievit Indo 25kg", price: "1.450.000 đ", rating: 5, img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=100&q=80" },
                { name: "Trà Đen Phúc Long 1kg", price: "120.000 đ", rating: 5, img: "https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=100&q=80" },
                { name: "Trân châu Gia Uy 3kg", price: "65.000 đ", rating: 4, img: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?auto=format&fit=crop&w=100&q=80" },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center cursor-pointer hover:scale-[1.02] transition-transform">
                  <div className="size-16 rounded-xl bg-[#FAF8F6] border border-[#E6DFD9]/50 overflow-hidden shrink-0">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-[#1C1917] leading-snug line-clamp-1">{item.name}</h4>
                    <div className="text-xs font-bold text-primary">{item.price}</div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`size-2.5 ${s <= item.rating ? "fill-[#D2B48C] text-[#D2B48C]" : "text-gray-200"}`} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* Right Main Column */}
        <div className="flex-1 min-w-0 flex flex-col gap-12">
          {/* 1. Hero Banner Section (Figma style) */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#FAF3E0] to-[#FAF8F6] border border-[#E6DFD9] px-8 py-16 md:px-12 md:py-20 shadow-sm">
            <div className="absolute -right-40 -top-40 size-96 rounded-full bg-[#D2B48C]/15 blur-3xl pointer-events-none" />
            <div className="absolute right-10 bottom-0 size-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

            <div className="relative z-10 grid gap-8 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 space-y-6 max-w-2xl">
                <h1 className="text-4xl font-extrabold tracking-tight text-[#1C1917] sm:text-5xl leading-tight">
                  Giải pháp Ly nhựa & Nguyên liệu Trà sữa trọn gói
                </h1>
                <p className="text-sm text-[#7A6F68] leading-relaxed">
                  Hỗ trợ thiết kế thương hiệu miễn phí. Cam kết sản phẩm chất lượng cao, giao hàng hỏa tốc và chiết khấu tốt nhất cho quán F&B của bạn.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <div className="flex items-center gap-0.5 rounded-full border border-[#E6DFD9] bg-white p-1 shadow-sm w-full max-w-md focus-within:ring-2 focus-within:ring-primary focus-within:border-primary">
                    <input
                      type="email"
                      placeholder="Nhập email của bạn..."
                      className="flex-1 bg-transparent border-0 px-3 text-xs focus:ring-0 focus:outline-none placeholder-[#7A6F68]/70"
                    />
                    <Button className="bg-primary text-primary-foreground hover:bg-[#4A2E22] text-xs font-bold rounded-full h-9 px-6 shrink-0">
                      Đăng ký nhận báo giá
                    </Button>
                  </div>
                </div>
              </div>

              {/* Logo visual block */}
              <div className="hidden lg:col-span-5 lg:flex justify-center select-none">
                <div className="relative rounded-full bg-white p-8 shadow-xl border border-[#E6DFD9]/60 hover:scale-[1.03] transition-transform duration-500">
                  <Logo size={140} />
                </div>
              </div>
            </div>
          </section>

          {/* 2. Popular Products Header & Tabs Grid */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E6DFD9] pb-3">
              <h2 className="text-2xl font-extrabold text-[#1C1917]">Sản phẩm phổ biến</h2>
              <div className="flex flex-wrap gap-1 text-xs font-semibold text-[#7A6F68]">
                {["Tất cả", "Nguyên liệu", "Ly chưa in", "Ly đã in"].map((tab, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "cursor-pointer hover:text-primary transition-colors px-3 py-1.5 rounded-md",
                      idx === 0 ? "text-primary font-bold bg-[#FAF8F6] border border-[#E6DFD9]" : ""
                    )}
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>
            <CatalogGrid products={featuredProducts} title="" />
          </div>

          {/* 3. Promo Banners Section (Figma style) */}
          <section className="grid gap-4 md:grid-cols-3">
            {promoBanners.map((banner, idx) => {
              const Icon = banner.icon;
              return (
                <div
                  key={idx}
                  className={`${banner.bg} ${banner.textColor} rounded-2xl p-6 flex flex-col justify-between gap-6 border border-[#E6DFD9]/40 shadow-sm relative overflow-hidden group hover:shadow-md transition-all`}
                >
                  <div className="absolute -right-6 -bottom-6 size-24 opacity-10 group-hover:scale-125 transition-transform duration-300">
                    <Icon className="size-full" />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <div className="inline-flex rounded-lg bg-white/20 p-2 backdrop-blur-md mb-2">
                      <Icon className="size-5 text-current" />
                    </div>
                    <h3 className="text-lg font-bold leading-tight">{banner.title}</h3>
                    <p className="text-xs opacity-80 leading-relaxed">{banner.desc}</p>
                  </div>
                  <Button
                    variant={idx === 1 ? "secondary" : "default"}
                    className="w-fit text-xs font-bold h-9 px-4 relative z-10 self-start"
                  >
                    {banner.btnText}
                  </Button>
                </div>
              );
            })}
          </section>
        </div>
      </div>

      {/* 5. Daily Deals of the Day (Figma layout) */}
      <section className="space-y-4 pt-4 border-t border-[#E6DFD9]/50">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
              <Flame className="size-3.5 text-primary animate-pulse" />
              Hot Deals cực khủng
            </div>
            <h2 className="text-xl font-bold text-[#1C1917] mt-0.5">Khuyến mãi trong ngày</h2>
          </div>
        </div>
        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {deals.map((deal, idx) => {
            const mappedProduct: CatalogProduct = {
              id: `deal-${idx}`,
              productRefId: `DEAL-${idx}`,
              slug: `deal-${idx}-${deal.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
              name: deal.title,
              category: deal.category === "Ly chưa in" ? "plain_cup" : "ingredient",
              price: deal.oldPrice,
              b2bPrice: deal.price,
              unit: deal.category === "Ly chưa in" ? "thùng" : "bao",
              stockSnapshot: 100,
              imageUrl: deal.image,
              updatedAt: new Date().toISOString(),
            };

            return (
              <div
                key={idx}
                className="w-[85vw] sm:w-[45vw] md:w-[30vw] lg:w-[calc(25%-18px)] shrink-0 snap-start flex flex-col relative"
              >
                {/* Aspect-ratio rounded image with overlay countdown */}
                <div className="relative w-full aspect-[4/3.5] rounded-3xl overflow-hidden shadow-sm">
                  <img
                    src={deal.image}
                    alt={deal.title}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-black/5" />

                  {/* Countdown boxes centered absolute overlay */}
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 w-[90%] justify-center">
                    <div className="bg-white rounded-lg px-1 py-1.5 text-center min-w-[42px] sm:min-w-[45px] shadow-md flex flex-col justify-center">
                      <span className="text-[11px] sm:text-xs font-extrabold text-primary leading-none">{deal.days}</span>
                      <span className="text-[7px] text-[#7A6F68] mt-0.5 uppercase tracking-wider font-semibold">Ngày</span>
                    </div>
                    <div className="bg-white rounded-lg px-1 py-1.5 text-center min-w-[42px] sm:min-w-[45px] shadow-md flex flex-col justify-center">
                      <span className="text-[11px] sm:text-xs font-extrabold text-primary leading-none">{deal.hours}</span>
                      <span className="text-[7px] text-[#7A6F68] mt-0.5 uppercase tracking-wider font-semibold">Giờ</span>
                    </div>
                    <div className="bg-white rounded-lg px-1 py-1.5 text-center min-w-[42px] sm:min-w-[45px] shadow-md flex flex-col justify-center">
                      <span className="text-[11px] sm:text-xs font-extrabold text-primary leading-none">{deal.mins}</span>
                      <span className="text-[7px] text-[#7A6F68] mt-0.5 uppercase tracking-wider font-semibold">Phút</span>
                    </div>
                    <div className="bg-white rounded-lg px-1 py-1.5 text-center min-w-[42px] sm:min-w-[45px] shadow-md flex flex-col justify-center">
                      <span className="text-[11px] sm:text-xs font-extrabold text-primary leading-none">{deal.secs}</span>
                      <span className="text-[7px] text-[#7A6F68] mt-0.5 uppercase tracking-wider font-semibold">Giây</span>
                    </div>
                  </div>
                </div>

                {/* White card overlapping bottom of the image */}
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-[#E6DFD9]/60 relative z-20 mx-4 -mt-12 flex flex-col justify-between flex-1">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-[#1C1917] leading-snug line-clamp-2 min-h-[2.5rem] hover:text-primary transition-colors cursor-pointer">
                      {deal.title}
                    </h3>
                    <div className="flex items-center gap-1 text-[9px] text-[#7A6F68] font-semibold">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={cn(
                              "size-3",
                              s <= Math.floor(deal.rating)
                                ? "fill-[#D2B48C] text-[#D2B48C]"
                                : "text-gray-200"
                            )}
                          />
                        ))}
                      </div>
                      <span>({deal.rating.toFixed(1)})</span>
                    </div>
                    <div className="text-[10px] text-[#7A6F68] font-semibold">
                      By <span className="text-primary font-bold">{deal.vendor}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#E6DFD9]/40">
                    <div>
                      <div className="text-[13px] font-extrabold text-primary">{(deal.price).toLocaleString("vi-VN")} đ</div>
                      <div className="text-[10px] text-[#7A6F68] line-through -mt-0.5">{(deal.oldPrice).toLocaleString("vi-VN")} đ</div>
                    </div>
                    <AddToCartButton
                      product={mappedProduct}
                      variant="secondary"
                      className="bg-[#EADEC9]/30 text-primary hover:bg-primary hover:text-[#FAF8F6] border-0 transition-colors font-bold text-xs h-8 px-3 rounded-md cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Product Lists 4 Columns (Figma layout) */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-4 border-t border-[#E6DFD9]/50">
        {listCols.map((col, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-sm font-bold border-b border-[#E6DFD9] pb-2 text-[#1C1917] flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {col.title}
            </h3>
            <div className="space-y-3.5">
              {col.items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex gap-3.5 items-center hover:scale-[1.02] transition-transform duration-200 cursor-pointer">
                  <div className="size-14 rounded-lg bg-[#FAF8F6] border border-[#E6DFD9]/50 shrink-0 flex items-center justify-center text-[10px] font-bold text-[#7A6F68]">
                    Logo
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[#1C1917] leading-snug line-clamp-1">{item.name}</h4>
                    <div className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-primary">{item.price}</span>
                      {item.oldPrice ? (
                        <span className="text-[10px] text-[#7A6F68] line-through">{item.oldPrice}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
