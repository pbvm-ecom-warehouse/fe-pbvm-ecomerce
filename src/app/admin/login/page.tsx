"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F6]">
      <div className="text-sm font-medium text-slate-500 animate-pulse">
        Đang chuyển hướng sang trang đăng nhập dùng chung...
      </div>
    </div>
  );
}
