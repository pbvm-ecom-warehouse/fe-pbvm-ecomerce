"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PhoneCall, Search, ShoppingCart, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { shopRoutes } from "@/constants/routes";
import { countCartItems } from "@/features/cart/utils/cart";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { formatCurrency } from "@/utils/format-currency";
import {
  listCatalogProducts,
  fallbackCatalogProducts,
} from "@/features/catalog/services/catalog.service";
import type { CatalogProduct } from "@/types/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const AUTH_PATHS = ["/login", "/register"];

export function StoreHeader() {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const itemCount = countCartItems(items);

  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [allProducts, setAllProducts] = useState<CatalogProduct[]>([]);

  useEffect(() => {
    listCatalogProducts()
      .then((res) => {
        if (res && res.data && res.data.length > 0) {
          setAllProducts(res.data);
        } else {
          setAllProducts(fallbackCatalogProducts);
        }
      })
      .catch(() => {
        setAllProducts(fallbackCatalogProducts);
      });
  }, []);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.productRefId && p.productRefId.toLowerCase().includes(q)),
    );
  }, [searchQuery, allProducts]);

  if (AUTH_PATHS.includes(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#E9E3DD] bg-[#FAF8F6]/95 text-foreground backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-4 px-4 lg:px-8">
        <Link href="/" className="group flex min-w-fit items-center gap-3">
          <div className="rounded-xl border border-border bg-muted p-1.5 shadow-sm transition-transform group-hover:scale-105">
            <Logo size={42} />
          </div>
          <div>
          </div>
        </Link>

        <div className="relative hidden max-w-xl flex-1 items-center rounded-xl border border-[#E9E3DD] bg-[#FAF8F6] p-1 transition-colors focus-within:border-primary lg:flex">
          <Input
            type="search"
            placeholder="Tìm nguyên liệu, ly in..."
            className="h-9 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          />
          <Button
            size="icon"
            aria-label="Tìm kiếm"
            className="size-9 rounded-lg bg-primary text-white hover:bg-[#2F9A68] border-0 cursor-pointer"
          >
            <Search className="size-4" />
          </Button>

          {/* Suggestions Dropdown panel */}
          {isFocused && searchQuery.trim().length > 0 && (
            <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-[#E9E3DD] rounded-xl shadow-xl z-50 p-1.5 max-h-[320px] overflow-y-auto space-y-0.5">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    onClick={() => {
                      setSearchQuery("");
                      setIsFocused(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-emerald-50/50 transition-colors text-left"
                  >
                    <div className="relative size-10 rounded-md border bg-muted/40 flex items-center justify-center p-1 shrink-0 overflow-hidden">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="size-full object-cover rounded" />
                      ) : (
                        <span className="text-[8px] text-muted-foreground">No image</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] font-black text-primary mt-0.5">
                        {p.b2bPrice ? `${formatCurrency(p.b2bPrice)} (Sỉ)` : formatCurrency(p.price)} / {p.unit}
                      </p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground font-semibold">
                  Không tìm thấy sản phẩm nào phù hợp
                </div>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            className="hidden h-11 gap-2 rounded-xl px-3 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-primary md:inline-flex"
          >
            <Link href="/account">
              <UserRound className="size-5" />
              Tài khoản
            </Link>
          </Button>
          <Button
            asChild
            className="h-11 rounded-xl bg-primary px-3 font-bold text-white hover:bg-[#2F9A68]"
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



      {/* Navigation Bar Row */}
      <div className="border-t border-[#E9E3DD] py-2">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            {/* Categories dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-primary text-white hover:bg-[#2F9A68] text-xs font-bold gap-2 h-9 px-4 rounded-md cursor-pointer border-0">
                  <span className="grid gap-0.5">
                    <span className="h-0.5 w-4 bg-white" />
                    <span className="h-0.5 w-4 bg-white" />
                    <span className="h-0.5 w-4 bg-white" />
                  </span>
                  Danh mục sản phẩm
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-[#FAF8F6] border border-[#E9E3DD] rounded-xl shadow-md p-1.5 z-40">
                <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                  <Link href="/products">Tất cả sản phẩm</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                  <Link href="/products?category=ingredient">Nguyên liệu</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                  <Link href="/products?category=plain_cup">Ly chưa in</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                  <Link href="/products?category=printed_cup">Ly đã in</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                       "text-xs font-semibold h-9 px-3 transition-colors",
                       "hover:bg-[#DEF9EC] hover:text-[#253D4E]",
                       active
                         ? "bg-primary text-white font-bold hover:bg-primary hover:text-white"
                         : "text-foreground"
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
              <div className="text-[9px] text-muted-foreground font-medium mt-0.5">Hỗ trợ 24/7</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
