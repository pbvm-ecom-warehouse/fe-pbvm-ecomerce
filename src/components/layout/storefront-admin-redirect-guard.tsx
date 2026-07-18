"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export function StorefrontAdminRedirectGuard({
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

  useEffect(() => {
    if (mounted && user && user.type === "admin") {
      // If admin tries to access storefront routes
      if (pathname && !pathname.startsWith("/admin")) {
        router.replace("/admin/catalog/products");
      }
    }
  }, [mounted, user, pathname, router]);

  // Block rendering storefront elements for admin when they attempt to view them
  if (
    mounted &&
    user &&
    user.type === "admin" &&
    pathname &&
    !pathname.startsWith("/admin")
  ) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#FAF8F6]">
        <div className="flex flex-col items-center gap-2">
          <div className="size-8 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <div className="text-xs text-slate-400 font-medium">
            Đang chuyển hướng về trang quản trị...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
