import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* Chiếm toàn bộ viewport, không scroll */
    <div className="fixed inset-0 flex overflow-hidden bg-white">

      {/* ===== CỘT TRÁI: Brand Visual Panel (desktop only) ===== */}
      <div className="relative hidden lg:flex lg:w-1/2 shrink-0 flex-col justify-between bg-[#EBF8F3]/60 overflow-hidden p-14 text-[#1E3E30]">
        
        {/* Floating circles/bubbles styled to match the mockup but in emerald theme */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[440px] w-[440px] rounded-full bg-[#DEF9EC]/90 z-0" />
        <div className="absolute top-[12%] left-[10%] h-24 w-24 rounded-full bg-[#C2EED7]/50 blur-[2px] z-0 animate-bounce duration-6000" />
        <div className="absolute bottom-[18%] right-[8%] h-36 w-36 rounded-full bg-[#C2EED7]/70 z-0" />
        <div className="absolute top-[60%] right-[12%] h-10 w-10 rounded-full bg-[#DEF9EC] shadow-[0_4px_12px_rgba(59,183,126,0.08)]" />
        <div className="absolute bottom-[10%] left-[12%] h-12 w-12 rounded-full bg-[#DEF9EC]/40" />

        {/* Back to store */}
        <Link
          href="/"
          className="relative z-10 inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-500/10 bg-white/50 px-4.5 py-2.5 text-xs font-extrabold text-[#1E3E30] backdrop-blur-md transition-all hover:bg-white hover:border-emerald-500/20 hover:shadow-sm active:scale-95"
        >
          <ArrowLeft className="h-4.5 w-4.5 text-[#3BB77E]" />
          Quay lại cửa hàng
        </Link>

        {/* Center illustration & text */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto">
          <img
            src="/images/auth-banner.png"
            alt="PBVM Packaging"
            className="max-w-[70%] xl:max-w-[65%] aspect-square object-contain transition-transform duration-700 hover:scale-105"
          />
          <div className="mt-8 text-center max-w-sm">
            <h2 className="text-2xl font-black tracking-tight text-[#1E3E30]">
              Hiện thực hóa ý tưởng của bạn.
            </h2>
            <p className="mt-2 text-[13px] font-semibold text-[#547366] leading-relaxed">
              In cốc nhựa custom, phân phối nguyên liệu trà sữa chất lượng cao, đồng bộ kho WMS trực tiếp.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-center text-[11px] text-[#78858F] font-bold">
          &copy; {new Date().getFullYear()} PBVM Shop. Tất cả các quyền được bảo lưu.
        </p>
      </div>

      {/* ===== CỘT PHẢI: Form Area ===== */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 sm:px-12 md:px-16 lg:w-1/2 bg-white">
        {/* Mobile: back link */}
        <Link
          href="/"
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-[#FAF9F6] px-3.5 py-2 text-xs font-bold text-[#253D4E] transition hover:bg-[#F3F1EC] active:scale-95 lg:hidden"
        >
          <ArrowLeft className="h-4 w-4 text-[#3BB77E]" />
          Trang chủ
        </Link>

        {/* Form container sits cleanly directly on the page, matching the mockup */}
        <div className="w-full max-w-[420px] py-4 transition-all duration-300">
          {children}
        </div>
      </div>
    </div>
  );
}
