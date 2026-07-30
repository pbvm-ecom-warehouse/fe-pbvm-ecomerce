"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
  LogOut,
  PackageCheck,
  PhoneCall,
  Search,
  ShoppingCart,
  Sparkles,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { shopRoutes } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useAuthStore } from "@/stores/auth-store";
import { logout } from "@/features/auth/services/auth.service";
import { formatCurrency } from "@/utils/format-currency";
import {
  listCatalogProducts,
} from "@/features/catalog/services/catalog.service";
import { adminListCategories, subscribeProductSync } from "@/features/catalog/services/admin-catalog.service";
import { publicApiFetch } from "@/lib/public-api";
import type { CatalogProduct } from "@/types/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  NOTIFICATIONS_CHANGED_EVENT,
} from "@/features/notification/services/notification.service";

const AUTH_PATHS = ["/login", "/register"];

function formatRelativeTime(dateStr?: string) {
  if (!dateStr) return "Vừa xong";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Mới đây";
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

export function StoreHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const items = useCartStore((state) => state.items);
  const itemCount = items.length;
  const user = useAuthStore((state) => state.user);
  const fetchAndSyncCart = useCartStore((state) => state.fetchAndSyncCart);

  useEffect(() => {
    if (user && user.type !== "admin") {
      fetchAndSyncCart();
    }
  }, [user, fetchAndSyncCart]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [allProducts, setAllProducts] = useState<CatalogProduct[]>([]);
  const [headerCategories, setHeaderCategories] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    const syncHeaderData = () => {
      listCatalogProducts()
        .then((res) => {
          if (res && res.data && res.data.length > 0) {
            setAllProducts(res.data);
          } else {
            setAllProducts([]);
          }
        })
        .catch(() => {
          setAllProducts([]);
        });

      adminListCategories()
        .then((res) => {
          setHeaderCategories(Array.isArray(res) ? res : []);
        })
        .catch((err) => console.error("Header categories fetch failed:", err));
    };

    syncHeaderData();

    const unsubscribe = subscribeProductSync(syncHeaderData);
    return () => {
      unsubscribe();
    };
  }, []);

  // FETCH REAL NOTIFICATIONS from backend API
  useEffect(() => {
    let isMounted = true;

    function iconForType(type: string) {
      if (type === "PAYMENT_SUCCESS") return CreditCard;
      if (type === "PAYMENT_FAILED" || type === "PAYMENT_CANCELLED") return CreditCard;
      if (type === "ORDER_CONFIRMED" || type === "ORDER_FULFILLED") return PackageCheck;
      if (type === "DESIGN_SAVED") return Sparkles;
      return ShoppingCart;
    }
    function colorForType(type: string) {
      if (type === "PAYMENT_SUCCESS") return "bg-emerald-100 text-emerald-700";
      if (type === "PAYMENT_FAILED" || type === "PAYMENT_CANCELLED") return "bg-rose-100 text-rose-700";
      if (type === "ORDER_CONFIRMED" || type === "ORDER_FULFILLED") return "bg-emerald-100 text-emerald-700";
      if (type === "DESIGN_SAVED") return "bg-amber-100 text-amber-700";
      return "bg-blue-100 text-blue-700";
    }

    async function load() {
      try {
        const res = await listNotifications({ pageSize: 20 });
        if (!isMounted) return;
        setNotifications(
          res.data.map((n) => ({
            id: n.id,
            title: n.title,
            description: n.description,
            time: formatRelativeTime(n.createdAt),
            rawTime: new Date(n.createdAt).getTime(),
            read: n.isRead,
            link: n.link ?? "/orders",
            icon: iconForType(n.type),
            color: colorForType(n.type),
          }))
        );
      } catch (err) {
        console.error("Failed to load notifications:", err);
        if (isMounted) setNotifications([]);
      }
    }

    if (user && user.type === "customer") {
      load();
      window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    }
    return () => {
      isMounted = false;
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    };
  }, [user]);

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    // Fire-and-forget API call
    markAllNotificationsRead().catch(() => {});
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    // Fire-and-forget API call (only for IDs that look like real backend IDs)
    if (!id.startsWith("notif-order-") && !id.startsWith("notif-design-")) {
      markNotificationRead(id).catch(() => {});
    }
  };

  if (
    !mounted ||
    !pathname ||
    AUTH_PATHS.includes(pathname) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/design-cup")
  ) {
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
                        {formatCurrency(p.b2bPrice || p.price)} / {p.unit}
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
          {/* INTERACTIVE NOTIFICATIONS POPOVER ATTACHED TO BELL ICON */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-xl text-muted-foreground hover:bg-muted hover:text-primary cursor-pointer relative"
                title="Thông báo của tôi"
              >
                <Bell className="size-5 shrink-0" />
                {unreadCount > 0 && (
                  <span className="absolute top-2.5 right-2.5 flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-rose-600" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-[350px] sm:w-[380px] p-0 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-white z-50">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50/90 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Thông báo</span>
                  {unreadCount > 0 && (
                    <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full border-0 shadow-2xs">
                      {unreadCount} chưa đọc
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Đánh dấu đã đọc
                  </button>
                )}
              </div>

              <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-1.5">
                    <Bell className="size-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Chưa có thông báo mới nào</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <Link
                        key={n.id}
                        href={n.link}
                        onClick={() => markAsRead(n.id)}
                        className={cn(
                          "flex items-start gap-3 p-3.5 transition-colors text-left group cursor-pointer",
                          n.read ? "bg-white hover:bg-slate-50/80" : "bg-emerald-50/40 hover:bg-emerald-50/80",
                        )}
                      >
                        <div className={cn("size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs", n.color)}>
                          <Icon className="size-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                              {n.title}
                            </h4>
                            {!n.read && (
                              <span className="size-2 rounded-full bg-emerald-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-0.5 line-clamp-2">
                            {n.description}
                          </p>
                          <span className="text-[9.5px] font-semibold text-slate-400 mt-1 block">
                            {n.time}
                          </span>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 text-center">
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  <span>Xem tất cả đơn hàng của tôi</span>
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-11 gap-2 rounded-xl px-3 text-xs font-bold text-[#253D4E] hover:bg-emerald-50 hover:text-primary inline-flex cursor-pointer transition-colors"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="size-6 rounded-full object-cover border border-primary/20 shrink-0"
                    />
                  ) : (
                    <UserRound className="size-5 shrink-0 text-slate-500" />
                  )}
                  <span className="truncate max-w-[110px]">{user.name}</span>
                  <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in-80 zoom-in-95">
                <div className="px-3 py-2 bg-slate-50/80 rounded-xl mb-1 border border-slate-100">
                  <p className="text-xs font-extrabold text-[#253D4E] truncate">{user.name}</p>
                  {user.email && (
                    <p className="text-[11px] font-medium text-slate-400 truncate">{user.email}</p>
                  )}
                </div>

                <DropdownMenuItem asChild className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-primary py-2.5 px-3 cursor-pointer transition-colors">
                  <Link href="/account" className="flex items-center gap-2.5">
                    <UserRound className="size-4 text-slate-400" />
                    <span>Trang cá nhân</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-primary py-2.5 px-3 cursor-pointer transition-colors">
                  <Link href="/account/designs" className="flex items-center gap-2.5">
                    <Sparkles className="size-4 text-slate-400" />
                    <span>Thiết kế của tôi</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-primary py-2.5 px-3 cursor-pointer transition-colors">
                  <Link href="/orders" className="flex items-center gap-2.5">
                    <PackageCheck className="size-4 text-slate-400" />
                    <span>Đơn hàng của tôi</span>
                  </Link>
                </DropdownMenuItem>

                <div className="my-1 h-px bg-slate-100" />

                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 hover:text-rose-700 py-2.5 px-3 cursor-pointer transition-colors flex items-center gap-2.5 focus:bg-rose-50 focus:text-rose-700"
                >
                  <LogOut className="size-4 text-rose-500" />
                  <span>{isLoggingOut ? "Đang thoát..." : "Đăng xuất"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              variant="ghost"
              className="h-11 gap-2 rounded-xl px-3 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-primary inline-flex cursor-pointer"
            >
              <Link href="/login" className="flex items-center gap-2">
                <UserRound className="size-5 shrink-0" />
                <span>Đăng nhập</span>
              </Link>
            </Button>
          )}
          <Button
            asChild
            className="h-11 rounded-xl bg-primary px-3.5 font-bold text-white hover:bg-[#2F9A68]"
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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 lg:px-8">
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
              <DropdownMenuContent className="w-52 bg-[#FAF8F6] border border-[#E9E3DD] rounded-xl shadow-md p-1.5 z-40 max-h-72 overflow-y-auto">
                <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                  <Link href="/products">Tất cả sản phẩm</Link>
                </DropdownMenuItem>
                {headerCategories.length > 0 ? (
                  headerCategories.map((cat) => (
                    <DropdownMenuItem key={cat.id || cat._id || cat.slug} asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                      <Link href={`/products?category=${encodeURIComponent(cat.slug || cat.id || cat._id)}`}>
                        {cat.name}
                      </Link>
                    </DropdownMenuItem>
                  ))
                ) : (
                  <>
                    <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                      <Link href="/products?category=plain_cup">Ly chưa in</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                      <Link href="/products?category=printed_cup">Ly đã in</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                      <Link href="/products?category=ingredient">Nguyên liệu</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Nav Links */}
            <nav className="hidden items-center gap-1 md:flex">
              {/* Trang chủ & Sản phẩm */}
              {shopRoutes.slice(0, 2).map((route) => {
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

              {/* Đặt ly Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "text-xs font-semibold h-9 px-3 transition-colors gap-1 inline-flex items-center justify-center text-center leading-none",
                      "hover:bg-[#DEF9EC] hover:text-[#253D4E]",
                      pathname === "/design-cup"
                        ? "bg-primary text-white font-bold hover:bg-primary hover:text-white"
                        : "text-foreground cursor-pointer"
                    )}
                  >
                    <span className="inline-flex items-center justify-center">Đặt ly</span>
                    <ChevronDown className="size-3.5 shrink-0 opacity-80" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-[#FAF8F6] border border-[#E9E3DD] rounded-xl shadow-md p-1.5 z-40">
                  <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                    <Link href="/products?category=plain_cup">Ly chưa thiết kế</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                    <Link href="/design-cup">Ly tự thiết kế</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Giới thiệu */}
              {shopRoutes.slice(2, 3).map((route) => {
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
        </div>
      </div>
    </header>
  );
}
