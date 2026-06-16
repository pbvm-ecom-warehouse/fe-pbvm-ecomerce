import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Boxes,
  Factory,
  Paintbrush,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/features/catalog/components/catalog-grid";
import type { CatalogProduct } from "@/types/api";

const categoryTiles = [
  {
    title: "Ly nhựa đã in",
    description: "Mẫu in sẵn cho chuỗi F&B, đóng thùng và xuất kho nhanh.",
    href: "/products?category=printed_cup",
    image: "/images/hero-bg.png",
  },
  {
    title: "Nguyên liệu trà sữa",
    description: "Bột kem, trà, topping và syrup cho vận hành hằng ngày.",
    href: "/products?category=ingredient",
    image: "/images/product-placeholder.svg",
  },
  {
    title: "Ly trắng in riêng",
    description: "Thiết kế logo, kiểm tra 3D và gửi file in theo đơn.",
    href: "/design-cup",
    image: "/images/hero-bg.png",
  },
];

const trustStats = [
  { icon: Boxes, label: "SKU đồng bộ", value: "Realtime WMS" },
  { icon: Factory, label: "In ly custom", value: "2D + 3D preview" },
  { icon: Truck, label: "Giao sỉ", value: "Chành xe / nội thành" },
];

export function StorefrontHome({
  featuredProducts,
}: {
  featuredProducts: CatalogProduct[];
}) {
  return (
    <main className="flex min-h-screen flex-col bg-[#FAF8F6] text-[#1C1917]">
      <section className="relative isolate flex min-h-[520px] items-center overflow-hidden">
        <Image
          src="/images/hero-bg.png"
          alt="Ly in thương hiệu và nguyên liệu đóng gói PBVM"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/10" />
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#D7C4B7]">
              Bao bì và nguyên liệu B2B
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-normal md:text-6xl">
              Đặt hàng nhanh cho quán, nâng tầm thương hiệu trà sữa.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-200 md:text-base">
              PBVM gom catalog nguyên liệu, ly nhựa và dịch vụ in riêng vào một
              luồng mua hàng rõ ràng: xem tồn, chọn mẫu, thiết kế ly và checkout
              theo dữ liệu WMS đã đồng bộ.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 rounded-xl bg-[#D7C4B7] px-5 text-sm font-bold text-[#1C1816] hover:bg-white"
              >
                <Link href="/products">
                  Xem catalog sỉ
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-xl border-white/25 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur hover:bg-white/20 hover:text-white"
              >
                <Link href="/design-cup">
                  <Paintbrush data-icon="inline-start" />
                  Tự thiết kế ly 3D
                </Link>
              </Button>
            </div>
            <div className="mt-6 flex flex-wrap gap-5 text-xs font-semibold text-zinc-200">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-[#D7C4B7]" />
                COD cho hàng sẵn
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BadgePercent className="size-4 text-[#D7C4B7]" />
                Giá B2B theo sản phẩm
              </span>
            </div>
          </div>

          <div className="grid gap-3 self-end rounded-2xl border border-white/15 bg-white/10 p-4 text-white shadow-2xl backdrop-blur-md">
            {trustStats.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-xl bg-white/10 p-3"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-[#D7C4B7] text-[#1C1816]">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-300">{item.label}</div>
                    <div className="text-sm font-bold">{item.value}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 lg:px-8">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
            Danh mục B2B
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-normal">
            Sản phẩm tuyển chọn
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {categoryTiles.map((tile) => (
            <Link
              key={tile.title}
              href={tile.href}
              className="group relative min-h-[240px] overflow-hidden rounded-2xl border border-[#E6DFD9] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Image
                src={tile.image}
                alt={tile.title}
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="text-xl font-black">{tile.title}</h3>
                <p className="mt-1 text-xs leading-5 text-white/80">
                  {tile.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-12 lg:px-8">
        <CatalogGrid products={featuredProducts} title="Sản phẩm bán chạy" />
      </section>
    </main>
  );
}
