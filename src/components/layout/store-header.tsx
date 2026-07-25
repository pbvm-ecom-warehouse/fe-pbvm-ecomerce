"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CreditCard,
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
import { formatCurrency } from "@/utils/format-currency";
import {
  listCatalogProducts,
} from "@/features/catalog/services/catalog.service";
import { adminListCategories } from "@/features/catalog/services/admin-catalog.service";
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

import { listOrders } from "@/features/order/services/order.service";

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

  if (pathname?.startsWith("/design-cup")) {
    return null;
  }
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
        if (Array.isArray(res) && res.length > 0) {
          setHeaderCategories(res);
        }
      })
      .catch((err) => console.error("Header categories fetch failed:", err));
  }, []);

  // FETCH REAL DYNAMIC NOTIFICATIONS FROM BACKEND ORDERS & SAVED DESIGNS
  useEffect(() => {
    let isMounted = true;

    async function loadRealNotifications() {
      const realNotifs: any[] = [];

      // 1. Fetch real Backend Orders (only for customer users)
      if (user?.type === "customer") {
        try {
          const orderRes = await listOrders();
          const ordersList = Array.isArray(orderRes) ? orderRes : orderRes?.data || [];

          ordersList.forEach((o: any) => {
            const codeStr = o.code || (o.id ? o.id.slice(-6).toUpperCase() : "ECOM");
            const orderCode = String(codeStr).startsWith("ORD-") ? codeStr : `ORD-${codeStr}`;
            const rawDate = o.placedAt || o.createdAt || o.updatedAt;
            const timeStr = formatRelativeTime(rawDate);
            const totalVal = formatCurrency(o.totalAmount || o.total || 0);

            if (o.paymentStatus === "PAID") {
              realNotifs.push({
                id: `notif-order-paid-${o.id || o._id}`,
                title: `Thanh toán PayOS thành công`,
                description: `Đơn hàng #${orderCode} (${totalVal}) đã thanh toán thành công qua PayOS.`,
                time: timeStr,
                rawTime: rawDate ? new Date(rawDate).getTime() : 0,
                read: false,
                link: o.id || o._id ? `/orders/${o.id || o._id}` : "/orders",
                icon: CreditCard,
                color: "bg-emerald-100 text-emerald-700",
              });
            } else {
              realNotifs.push({
                id: `notif-order-placed-${o.id || o._id}`,
                title: `Đơn hàng mới #${orderCode}`,
                description: `Đơn hàng giá trị ${totalVal} đã được ghi nhận vào hệ thống.`,
                time: timeStr,
                rawTime: rawDate ? new Date(rawDate).getTime() : 0,
                read: false,
                link: o.id || o._id ? `/orders/${o.id || o._id}` : "/orders",
                icon: ShoppingCart,
                color: "bg-blue-100 text-blue-700",
              });
            }

            if (o.orderStatus === "CONFIRMED" || o.orderStatus === "FULFILLED") {
              realNotifs.push({
                id: `notif-order-ship-${o.id || o._id}`,
                title: `Đơn hàng #${orderCode} đang xử lý`,
                description: `Bộ phận WMS kho đã nhận yêu cầu đóng gói và vận chuyển.`,
                time: timeStr,
                rawTime: rawDate ? new Date(rawDate).getTime() : 0,
                read: true,
                link: o.id || o._id ? `/orders/${o.id || o._id}` : "/orders",
                icon: PackageCheck,
                color: "bg-emerald-100 text-emerald-700",
              });
            }
          });
        } catch (err) {
          console.error("Error loading real order notifications:", err);
        }
      }

      // 2. Fetch real Saved Cup Designs
      if (typeof window !== "undefined") {
        try {
          const savedStr = localStorage.getItem("pbvm_saved_cup_designs");
          if (savedStr) {
            const savedList = JSON.parse(savedStr);
            if (Array.isArray(savedList)) {
              savedList.slice(0, 3).forEach((d: any) => {
                realNotifs.push({
                  id: `notif-design-${d.id}`,
                  title: `Đã lưu mẫu thiết kế mới`,
                  description: `Mẫu thiết kế "${d.name || "Chưa đặt tên"}" đã lưu vào bộ sưu tập của bạn.`,
                  time: formatRelativeTime(d.createdAt),
                  rawTime: d.createdAt ? new Date(d.createdAt).getTime() : 0,
                  read: true,
                  link: "/design-cup",
                  icon: Sparkles,
                  color: "bg-amber-100 text-amber-700",
                });
              });
            }
          }
        } catch {
          // ignore
        }
      }

      // Sort by newest first
      realNotifs.sort((a, b) => (b.rawTime || 0) - (a.rawTime || 0));

      if (isMounted) {
        setNotifications(realNotifs);
      }
    }

    if (user && user.type === "customer") {
      loadRealNotifications();
    }
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
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  if (!mounted || !pathname || AUTH_PATHS.includes(pathname) || pathname.startsWith("/admin")) {
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
                  className="h-11 gap-2 rounded-xl px-3 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-primary inline-flex cursor-pointer"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="size-5 rounded-full object-cover border border-primary/20 shrink-0" />
                  ) : (
                    <UserRound className="size-5 shrink-0" />
                  )}
                  <span className="truncate max-w-[90px]">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-[#FAF8F6] border border-[#E9E3DD] rounded-xl shadow-md p-1.5 z-40">
                <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                  <Link href="/account">Trang cá nhân</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                  <Link href="/account/designs">Thiết kế của tôi</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                  <Link href="/orders">Đơn hàng của tôi</Link>
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
