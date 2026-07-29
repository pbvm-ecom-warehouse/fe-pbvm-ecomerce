import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  PackageCheck,
  Paintbrush,
  ShoppingBasket,
  Star,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CatalogGrid } from "@/features/catalog/components/catalog-grid";
import {
  cleanProductName,
  listCatalogCategories,
  listCatalogProducts,
} from "@/features/catalog/services/catalog.service";
import type { CatalogProduct } from "@/types/api";
import { formatCurrency } from "@/utils/format-currency";

function getProductImage(product?: CatalogProduct | null) {
  return product?.imageUrl || "/images/product-placeholder.svg";
}

function getProductHref(product: CatalogProduct) {
  return `/products/${encodeURIComponent(product.slug || product.id)}`;
}

function sortByDate(products: CatalogProduct[]) {
  return [...products].sort((a, b) => {
    const aTime = new Date((a as any).updatedAt || (a as any).createdAt || 0).getTime();
    const bTime = new Date((b as any).updatedAt || (b as any).createdAt || 0).getTime();
    return bTime - aTime;
  });
}

function ProductMiniList({
  title,
  products,
}: {
  title: string;
  products: CatalogProduct[];
}) {
  return (
    <div className="min-w-0">
      <div className="mb-4 border-b border-slate-100 pb-2">
        <h2 className="text-lg font-black text-[#253D4E]">{title}</h2>
        <div className="mt-2 h-0.5 w-12 rounded-full bg-[#3BB77E]" />
      </div>
      <div className="space-y-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={getProductHref(product)}
            className="group grid grid-cols-[64px_1fr] gap-3 rounded-2xl p-2 transition hover:bg-emerald-50/60"
          >
            <div className="relative size-16 overflow-hidden rounded-xl border border-slate-100 bg-white">
              <Image
                src={getProductImage(product)}
                alt={cleanProductName(product.name, product.productRefId || product.id)}
                fill
                className="object-contain p-2"
              />
            </div>
            <div className="min-w-0 pt-1">
              <h3 className="line-clamp-2 text-xs font-extrabold leading-5 text-[#253D4E] group-hover:text-[#3BB77E]">
                {cleanProductName(product.name, product.productRefId || product.id)}
              </h3>
              <div className="mt-1 flex items-center gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="size-2.5 fill-current" />
                ))}
              </div>
              <div className="mt-1 text-sm font-black text-[#3BB77E]">
                {formatCurrency(product.price || product.b2bPrice || 0)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([
    listCatalogProducts(),
    listCatalogCategories(),
  ]);

  const catalogProducts = products.data || [];
  const activeCategories = categories.filter(
    (category) => category.isDeleted !== true && !(category as any).deletedAt,
  );
  const heroProduct = catalogProducts.find((product) => product.imageUrl) || catalogProducts[0];
  const featuredProducts = catalogProducts.slice(0, 10);
  const topSelling = catalogProducts.slice(0, 3);
  const trending = [...catalogProducts]
    .sort((a, b) => Number(b.price || b.b2bPrice || 0) - Number(a.price || a.b2bPrice || 0))
    .slice(0, 3);
  const recent = sortByDate(catalogProducts).slice(0, 3);
  const topRated = [...catalogProducts]
    .sort((a, b) => (b.variants?.length || 0) - (a.variants?.length || 0))
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-white text-[#253D4E]">
      <section className="container mx-auto max-w-7xl px-4 pt-5 lg:px-8">
        <div className="relative min-h-[360px] overflow-hidden rounded-[28px] bg-[#F6F4EF]">
          <Image
            src="/images/hero-bg.png"
            alt="Không gian quán với ly, bao bì và nguyên liệu"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-white/50" />
          <div className="absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-white/80 to-transparent md:block" />
          <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-white/75 to-transparent md:block" />
          <div className="relative z-10 mx-auto flex min-h-[360px] max-w-2xl flex-col items-center justify-center px-6 py-12 text-center">
            <h1 className="text-4xl font-black leading-tight tracking-normal text-[#253D4E] md:text-6xl">
              Nhập hàng cho quán nhanh và gọn hơn
            </h1>
            <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-slate-600">
              Ly nhựa, bao bì, nguyên liệu và ly in theo thiết kế, tất cả nằm trong một shop dễ tìm.
            </p>
            <div className="mt-7 flex w-full max-w-md flex-col gap-3 rounded-full bg-white p-2 shadow-xl shadow-slate-900/10 sm:flex-row">
              <Button asChild className="h-12 flex-1 rounded-full bg-[#3BB77E] text-sm font-black text-white hover:bg-[#2F9A68]">
                <Link href="/products">
                  Mua ngay
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="h-12 flex-1 rounded-full text-sm font-black text-[#253D4E] hover:bg-emerald-50">
                <Link href="/design-cup">
                  Thiết kế ly
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Ly và bao bì cho quán",
              copy: "Chọn nhanh theo dung tích, chất liệu và kiểu dáng.",
              image: "/images/clear_cups.png",
              href: "/products?category=plain_cup",
              tone: "bg-[#F3E9D7]",
            },
            {
              title: "Nguyên liệu pha chế",
              copy: "Topping, trà, sữa và vật tư vận hành hằng ngày.",
              image: "/images/boba_ingredients.png",
              href: "/products?category=ingredient",
              tone: "bg-[#F7E8EA]",
            },
            {
              title: "Ly in theo thương hiệu",
              copy: "Thiết kế mẫu riêng và thanh toán bằng luồng đặt in.",
              image: "/images/printed_cups.png",
              href: "/design-cup",
              tone: "bg-[#E9EEF7]",
            },
          ].map((banner) => (
            <Link
              key={banner.title}
              href={banner.href}
              className={`group relative min-h-44 overflow-hidden rounded-2xl p-7 ${banner.tone}`}
            >
              <div className="relative z-10 max-w-[58%]">
                <h2 className="text-xl font-black leading-6 text-[#253D4E]">{banner.title}</h2>
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{banner.copy}</p>
                <span className="mt-4 inline-flex h-8 items-center gap-1 rounded-lg bg-[#3BB77E] px-3 text-xs font-black text-white">
                  Xem ngay
                  <ArrowRight className="size-3" />
                </span>
              </div>
              <Image
                src={banner.image}
                alt={banner.title}
                width={220}
                height={180}
                className="absolute -right-6 bottom-0 max-h-40 w-auto object-contain transition duration-300 group-hover:scale-105"
              />
            </Link>
          ))}
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 pb-12 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-[#253D4E]">Sản phẩm trong shop</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Danh sách lấy trực tiếp từ catalog hiện tại.</p>
          </div>
          <Link href="/products" className="hidden text-sm font-black text-[#3BB77E] hover:text-[#2F9A68] sm:inline-flex">
            Xem tất cả
          </Link>
        </div>
        <CatalogGrid
          products={featuredProducts}
          categories={activeCategories}
          title="Tất cả sản phẩm"
        />
      </section>

      {catalogProducts.length > 0 ? (
        <section className="container mx-auto max-w-7xl px-4 pb-10 lg:px-8">
          <div className="grid gap-7 md:grid-cols-2 xl:grid-cols-4">
            <ProductMiniList title="Top Selling" products={topSelling} />
            <ProductMiniList title="Trending Products" products={trending} />
            <ProductMiniList title="Recently Added" products={recent} />
            <ProductMiniList title="Top Rated" products={topRated} />
          </div>
        </section>
      ) : (
        <section className="container mx-auto max-w-7xl px-4 pb-10 lg:px-8">
          <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-10 text-center">
            <PackageCheck className="mx-auto mb-3 size-8 text-[#3BB77E]" />
            <h2 className="text-lg font-black text-[#253D4E]">Catalog đang cập nhật</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">Khi có sản phẩm thật từ hệ thống, trang chủ sẽ tự hiển thị tại đây.</p>
          </div>
        </section>
      )}

      <section className="border-t border-slate-100 bg-[#F8FAF7]">
        <div className="container mx-auto grid max-w-7xl gap-4 px-4 py-7 lg:grid-cols-3 lg:px-8">
          <div className="flex items-center gap-3">
            <Boxes className="size-6 text-[#3BB77E]" />
            <div>
              <div className="text-sm font-black">Đa dạng sản phẩm</div>
              <div className="text-xs font-semibold text-slate-500">{catalogProducts.length} sản phẩm đang bán</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Paintbrush className="size-6 text-[#3BB77E]" />
            <div>
              <div className="text-sm font-black">Hỗ trợ ly đặt in</div>
              <div className="text-xs font-semibold text-slate-500">Thiết kế riêng, thanh toán riêng</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="size-6 text-[#3BB77E]" />
            <div>
              <div className="text-sm font-black">Luồng thanh toán rõ ràng</div>
              <div className="text-xs font-semibold text-slate-500">COD cọc trước, online thanh toán đầy đủ</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
