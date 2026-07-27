"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronRight,
  FolderTree,
  Info,
  LogOut,
  PackageCheck,
  PackageOpen,
  ShoppingBag,
  ShoppingCart,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuthStore } from "@/stores/auth-store";
import { logout } from "@/features/auth/services/auth.service";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  listAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/features/notification/services/notification.service";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function iconForType(type: string) {
  if (type === "NEW_ORDER" || type === "ORDER_PLACED") return ShoppingCart;
  if (type === "ORDER_CONFIRMED" || type === "ORDER_FULFILLED") return PackageCheck;
  if (type === "ORDER_CANCELLED") return ShoppingBag;
  if (type === "FULFILLMENT_ALERT" || type === "LOW_STOCK") return PackageOpen;
  return Info;
}

function colorForType(type: string) {
  if (type === "NEW_ORDER" || type === "ORDER_PLACED") return "bg-blue-100 text-blue-700";
  if (type === "ORDER_CONFIRMED" || type === "ORDER_FULFILLED") return "bg-emerald-100 text-emerald-700";
  if (type === "ORDER_CANCELLED") return "bg-rose-100 text-rose-700";
  if (type === "FULFILLMENT_ALERT" || type === "LOW_STOCK") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

// ─── Admin Notification Bell ───────────────────────────────────────────────────

function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminNotifications({ pageSize: 20 });
      setNotifications(
        res.data.map((n) => ({
          id: n.id,
          title: n.title,
          description: n.description,
          time: formatRelativeTime(n.createdAt),
          read: n.isRead,
          link: n.link ?? "/admin/orders",
          icon: iconForType(n.type),
          color: colorForType(n.type),
        })),
      );
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll every 60 seconds to refresh
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllAdminNotificationsRead().catch(() => {});
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    markAdminNotificationRead(id).catch(() => {});
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          title="Thông báo quản trị"
        >
          <Bell className="size-4.5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex size-2.5 rounded-full bg-rose-600" />
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[340px] p-0 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-white z-50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Thông báo
            </span>
            {unreadCount > 0 && (
              <Badge className="bg-emerald-600 text-white font-bold text-[10px] px-1.5 py-0 rounded-full border-0">
                {unreadCount}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
            >
              Đánh dấu đã đọc
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="size-5 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center space-y-1.5">
              <Bell className="size-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-600">Không có thông báo mới</p>
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "flex items-start gap-3 p-3.5 transition-colors cursor-pointer group",
                    n.read
                      ? "bg-white hover:bg-slate-50"
                      : "bg-emerald-50/40 hover:bg-emerald-50/70",
                  )}
                >
                  <div
                    className={cn(
                      "size-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      n.color,
                    )}
                  >
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

        {/* Footer */}
        <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
          >
            <span>Xem tất cả đơn hàng</span>
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (mounted && !isLoginPage) {
      if (!user || user.type !== "admin") {
        const timer = setTimeout(() => {
          router.push("/login");
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [user, pathname, mounted, isLoginPage, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F6]">
        <div className="text-sm font-medium text-slate-500 animate-pulse">Đang tải...</div>
      </div>
    );
  }

  // If it's the login page, render children directly without sidebar
  if (isLoginPage) {
    return <div className="min-h-screen bg-[#FAF8F6]">{children}</div>;
  }

  // If not logged in as admin, show loading while redirecting
  if (!user || user.type !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF8F6]">
        <div className="text-sm font-medium text-slate-500">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  const menuItems = [
    {
      href: "/admin/catalog/categories",
      label: "Quản lý danh mục",
      icon: FolderTree,
    },
    {
      href: "/admin/orders",
      label: "Quản lý đơn hàng",
      icon: ShoppingBag,
    },
    {
      href: "/admin/finance",
      label: "Quản lý dòng tiền",
      icon: Wallet,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#FAF8F6] text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#E9E3DD] bg-white px-4 py-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="px-3 py-2">
            <Link href="/admin" className="flex items-center gap-2.5 group">
              <div className="rounded-xl border border-[#E9E3DD]/60 bg-[#FAF8F6] p-1 shadow-sm transition-transform group-hover:scale-105">
                <Logo size={28} />
              </div>
              <span className="text-sm font-black text-[#253D4E] tracking-tight">PBVM SHOP</span>
              <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                Admin
              </span>
            </Link>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Button
                  key={item.href}
                  asChild
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 h-10 px-3 rounded-xl text-xs font-bold transition-all border-0",
                    active
                      ? "bg-emerald-50 text-emerald-800 font-black shadow-2xs border border-emerald-200/80"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <Link href={item.href} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Icon className={cn("size-4", active ? "text-emerald-600" : "text-slate-400")} />
                      <span>{item.label}</span>
                    </div>
                    {active && (
                      <span className="size-1.5 rounded-full bg-emerald-600" />
                    )}
                  </Link>
                </Button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2 border-t border-[#E9E3DD] pt-4">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full justify-start gap-3 h-10 px-3 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 border-0 cursor-pointer"
          >
            <LogOut className="size-4 text-red-400" />
            Đăng xuất
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar with Bell */}
        <header className="h-14 border-b border-[#E9E3DD] bg-white px-6 flex items-center justify-between shrink-0">
          <div className="text-xs font-bold text-slate-400 truncate">
            {menuItems.find((m) => pathname.startsWith(m.href))?.label ?? "Trang quản trị"}
          </div>
          <div className="flex items-center gap-2">
            <AdminNotificationBell />
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="size-7 rounded-full bg-emerald-100 flex items-center justify-center text-[11px] font-black text-emerald-700">
                {user.name?.charAt(0).toUpperCase() ?? "A"}
              </div>
              <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate">
                {user.name}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
