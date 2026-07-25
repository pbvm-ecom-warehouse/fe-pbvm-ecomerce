"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FolderTree,
  Home,
  LogOut,
  PackageOpen,
  ShoppingBag,
  User,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { logout } from "@/features/auth/services/auth.service";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";

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
            <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-[#E9E3DD]/60 bg-[#FAF8F6] p-2.5 shadow-2xs">
              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
                <User className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">{user.name}</div>
                <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ecommerce Manager
                </div>
              </div>
            </div>
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
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
