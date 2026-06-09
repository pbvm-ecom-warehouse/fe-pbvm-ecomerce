"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, UserRound, Heart, GitCompare, Search, PhoneCall } from "lucide-react";

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

  // Ẩn header trên các trang auth (login/register tự có layout riêng)
  if (AUTH_PATHS.includes(pathname)) return null;

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#E6DFD9] bg-white/95 backdrop-blur-md">


      {/* Main Header Row */}
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-6 px-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 min-w-fit group">
          <div className="rounded-xl bg-[#FAF8F6] p-1.5 shadow-sm border border-[#E6DFD9]/80 group-hover:scale-105 transition-transform duration-300">
            <Logo size={42} />
          </div>
          <div>
            <div className="text-lg font-bold tracking-tight text-[#1C1917] leading-none">PBVM SHOP</div>
            <div className="text-[10px] font-semibold text-primary uppercase mt-0.5 tracking-wider">B2B / B2C Hub</div>
          </div>
        </Link>

        {/* Search Bar (Figma layout) */}
        <div className="hidden flex-1 max-w-xl items-center gap-0 rounded-lg border-2 border-primary/20 bg-[#FAF8F6] p-1 focus-within:border-primary lg:flex">
          <select className="bg-transparent px-3 py-1.5 text-xs font-medium text-[#1C1917] border-r border-[#E6DFD9] focus:outline-none cursor-pointer">
            <option>Tất cả danh mục</option>
            <option>Nguyên liệu trà sữa</option>
            <option>Ly nhựa chưa in</option>
            <option>Ly nhựa đã in</option>
            <option>Bột sữa & Kem béo</option>
          </select>
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm, nguyên liệu..."
              className="border-0 bg-transparent py-0 pl-3 h-8 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 text-sm text-[#1C1917] placeholder-[#7A6F68]/70"
            />
          </div>
          <Button size="icon" className="h-8 w-8 rounded-md bg-primary text-[#FAF8F6] hover:bg-[#4A2E22]">
            <Search className="size-4" />
          </Button>
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
