import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import { listCatalogProducts } from "@/features/catalog/services/catalog.service";
import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/features/catalog/components/catalog-grid";

export default async function HomePage() {
  const products = await listCatalogProducts();
  const featuredProducts = products.data.slice(0, 8);

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
              PBVM cung cấp ly nhựa in logo cao cấp và nguyên liệu trà sữa trực tiếp cho chuỗi cửa hàng.
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
                src="/images/printed_cups.png"
                alt="Ly nhựa đã in ấn"
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
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
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-90 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/images/boba_ingredients.png"
                  alt="Nguyên liệu trà sữa"
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover rounded-xl p-1"
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
              <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-90 group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/images/clear_cups.png"
                  alt="Ly nhựa chưa in"
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover rounded-xl p-1"
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


      {/* Section: Standard Catalog Products Grid */}
      <section className="py-6 md:py-8 bg-white dark:bg-[#1C1816]/30">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <CatalogGrid
            products={featuredProducts}
            title="Sản phẩm bán chạy nhất"
          />
        </div>
      </section>

    </div>
  );
}
