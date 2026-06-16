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

const AUTH_PATHS = ["/login", "/register"];

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

        {/* User Action Items (Nest style icons with small badges) */}
        <div className="ml-auto flex items-center gap-4">
          <Link href="/cart" className="relative flex flex-col items-center text-[#7A6F68] hover:text-primary transition-colors text-xs gap-1">
            <div className="relative">
              <ShoppingCart className="size-5" />
              {itemCount > 0 ? (
                <Badge className="absolute -top-1.5 -right-2 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-[9px] bg-primary text-white animate-bounce">
                  {itemCount}
                </Badge>
              ) : (
                <Badge className="absolute -top-1.5 -right-2 h-4 w-4 min-w-0 p-0 flex items-center justify-center text-[9px] bg-[#7A6F68] text-white">0</Badge>
              )}
            </div>
            <span>Giỏ hàng</span>
          </Link>

          <Link href="/account" className="relative flex flex-col items-center text-[#7A6F68] hover:text-primary transition-colors text-xs gap-1">
            <UserRound className="size-5" />
            <span>Tài khoản</span>
          </Link>
        </div>
      </div>

      {/* Navigation Bar Row */}
      <div className="border-t border-[#E6DFD9]/60 py-2">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            {/* Categories dropdown button */}
            <Button className="bg-primary text-[#FAF8F6] hover:bg-[#4A2E22] text-xs font-bold gap-2 h-9 px-4 rounded-md">
              <span className="grid gap-0.5">
                <span className="h-0.5 w-4 bg-[#FAF8F6]" />
                <span className="h-0.5 w-4 bg-[#FAF8F6]" />
                <span className="h-0.5 w-4 bg-[#FAF8F6]" />
              </span>
              Danh mục sản phẩm
            </Button>

            {/* Nav Links */}
            <nav className="hidden items-center gap-1 md:flex">
              {shopRoutes.map((route) => {
                const active = pathname === route.href;

                return (
                  <Button
                    key={route.href}
                    asChild
                    variant="ghost"
                    className={cn(
                      "text-xs font-semibold h-9 px-3 hover:text-primary hover:bg-[#FAF8F6]",
                      active ? "text-primary bg-[#FAF8F6] font-bold" : "text-[#1C1917]"
                    )}
                  >
                    <Link href={route.href}>{route.label}</Link>
                  </Button>
                );
              })}
            </nav>
          </div>

          {/* Hotline */}
          <div className="flex items-center gap-2 text-right">
            <div className="rounded-full bg-primary/10 p-2 text-primary md:block hidden">
              <PhoneCall className="size-4" />
            </div>
            <div className="md:block hidden">
              <div className="text-xs font-bold text-primary leading-none">1900-8888</div>
              <div className="text-[9px] text-[#7A6F68] font-medium mt-0.5">Hỗ trợ 24/7</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
