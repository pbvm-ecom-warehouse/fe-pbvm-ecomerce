"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { shopRoutes } from "@/constants/routes";
import { countCartItems } from "@/features/cart/utils/cart";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";

export function StoreHeader() {
  const pathname = usePathname();
  const items = useCartStore((state) => state.items);
  const itemCount = countCartItems(items);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="min-w-fit">
          <div className="text-sm font-semibold">PBVM Shop</div>
          <div className="text-xs text-muted-foreground">B2B / B2C</div>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {shopRoutes.map((route) => {
            const active = pathname === route.href;

            return (
              <Button
                key={route.href}
                asChild
                variant={active ? "secondary" : "ghost"}
                className={cn(active && "bg-accent")}
              >
                <Link href={route.href}>{route.label}</Link>
              </Button>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/cart">
              <ShoppingCart data-icon="inline-start" />
              Giỏ hàng
              {itemCount > 0 ? <Badge>{itemCount}</Badge> : null}
            </Link>
          </Button>
          <Button asChild size="icon" variant="ghost" aria-label="Tài khoản">
            <Link href="/account">
              <UserRound />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
