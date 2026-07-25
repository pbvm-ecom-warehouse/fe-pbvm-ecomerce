"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && user.type === "admin") {
        router.push("/admin/catalog/categories");
      } else {
        router.push("/login");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F6]">
      <div className="text-sm font-medium text-slate-500 animate-pulse">Đang chuyển hướng...</div>
    </div>
  );
}
