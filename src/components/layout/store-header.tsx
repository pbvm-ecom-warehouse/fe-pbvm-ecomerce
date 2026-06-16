"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, PhoneCall, Search, ShoppingCart, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { shopRoutes } from "@/constants/routes";
import { countCartItems } from "@/features/cart/utils/cart";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

export function StoreHeader() {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const itemCount = countCartItems(items);

  return (
    <header className="sticky top-0 z-30 border-b border-[#E6DFD9] bg-white/95 text-[#1C1917] backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-4 px-4 lg:px-8">
        <Link href="/" className="group flex min-w-fit items-center gap-3">
          <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-1.5 shadow-sm transition-transform group-hover:scale-105">
            <Logo size={42} />
          </div>
          <div>
            <div className="text-lg font-black leading-none tracking-normal">
              PBVM SHOP
            </div>
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              B2B / B2C Hub
            </div>
          </div>
        </Link>

        <div className="hidden max-w-xl flex-1 items-center rounded-xl border-2 border-primary/15 bg-[#FAF8F6] p-1 transition-colors focus-within:border-primary lg:flex">
          <select
            aria-label="Danh mục tìm kiếm"
            className="max-w-40 bg-transparent px-3 text-xs font-bold text-[#1C1917] outline-none"
          >
            <option>Tất cả danh mục</option>
            <option>Nguyên liệu</option>
            <option>Ly chưa in</option>
            <option>Ly đã in</option>
          </select>
          <div className="h-6 w-px bg-[#E6DFD9]" />
          <Input
            type="search"
            placeholder="Tìm SKU, nguyên liệu, ly in..."
            className="h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button
            size="icon"
            aria-label="Tìm kiếm"
            className="size-9 rounded-lg bg-primary text-white hover:bg-[#4A2E22]"
          >
            <Search className="size-4" />
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            className="hidden h-11 gap-2 rounded-xl px-3 text-xs font-bold text-[#7A6F68] hover:bg-[#FAF8F6] hover:text-primary md:inline-flex"
          >
            <Link href="/account">
              <UserRound className="size-5" />
              Tài khoản
            </Link>
          </Button>
          <Button
            asChild
            className="h-11 rounded-xl bg-primary px-3 font-bold text-white hover:bg-[#4A2E22]"
          >
            <Link href="/cart">
              <ShoppingCart data-icon="inline-start" />
              Giỏ hàng
              <Badge className="ml-1 border-0 bg-white text-primary">
                {itemCount}
              </Badge>
            </Link>
          </Button>
        </div>
      </div>

      <div className="border-t border-[#E6DFD9]/70">
        <div className="mx-auto flex h-12 w-full max-w-7xl items-center justify-between gap-3 px-4 lg:px-8">
          <Button className="h-9 rounded-lg bg-primary px-3 text-xs font-black text-white hover:bg-[#4A2E22]">
            <Menu className="size-4" />
            Danh mục
          </Button>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {shopRoutes.map((route) => {
              const active = pathname === route.href;

              return (
                <Button
                  key={route.href}
                  asChild
                  variant="ghost"
                  className={cn(
                    "h-9 rounded-lg px-3 text-xs font-bold text-[#1C1917] hover:bg-[#FAF8F6] hover:text-primary",
                    active && "bg-[#FAF8F6] text-primary",
                  )}
                >
                  <Link href={route.href}>{route.label}</Link>
                </Button>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 text-right md:flex">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <PhoneCall className="size-4" />
            </div>
            <div>
              <div className="text-xs font-black leading-none text-primary">
                1900-8888
              </div>
              <div className="mt-1 text-[9px] font-bold text-[#7A6F68]">
                Hỗ trợ B2B
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
