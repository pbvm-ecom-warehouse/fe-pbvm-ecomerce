import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Shield, Package, Tag } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /* Chiếm toàn bộ viewport, không scroll */
    <div className="fixed inset-0 flex overflow-hidden bg-background">

      {/* ===== CỘT TRÁI: Brand Panel (desktop) ===== */}
      <div className="relative hidden lg:flex lg:w-[420px] xl:w-[460px] shrink-0 flex-col justify-between bg-primary overflow-hidden p-10 text-white">
        {/* Decorative gradients */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#7A4F30]/30 via-primary to-[#1C1917]/50" />
        <div className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#D0B49F]/10 blur-3xl" />

        {/* Back to store */}
        <Link
          href="/"
          className="relative z-10 inline-flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại cửa hàng
        </Link>

        {/* Center branding */}
        <div className="relative z-10 flex flex-col items-center gap-5 text-center">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur-md transition-transform duration-300 hover:scale-105">
            <Logo size={90} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">PBVM SHOP</h2>
            <p className="mt-1.5 text-sm text-[#D0B49F] max-w-xs leading-relaxed">
              Hệ sinh thái cung ứng nguyên liệu &amp; ly trà sữa B2B / B2C hàng đầu.
            </p>
          </div>

          <div className="mt-4 w-full max-w-sm space-y-3 text-left">
            {[
              { icon: Package, title: "Tồn kho Realtime", desc: "Cam kết giữ hàng và xử lý tồn kho chính xác theo từng chi nhánh." },
              { icon: Shield, title: "Catalog Đồng Bộ WMS", desc: "Sản phẩm, danh mục và hình ảnh đồng bộ trực tiếp từ hệ thống kho." },
              { icon: Tag, title: "Chính sách B2B linh hoạt", desc: "Khách hàng sỉ nhận bảng giá riêng ngay sau khi tài khoản được duyệt." },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur-sm"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#D0B49F]" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-xs text-white/65 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-center text-[11px] text-white/40">
          &copy; {new Date().getFullYear()} PBVM. Bản quyền được bảo lưu.
        </p>
      </div>

      {/* ===== CỘT PHẢI: Form ===== */}
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-8 sm:px-8">
        {/* Mobile: back link */}
        <Link
          href="/"
          className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-lg border border-[#E6DFD9] bg-white px-3 py-1.5 text-xs font-semibold text-[#5C3D2E] shadow-sm transition hover:bg-[#FAF8F6] lg:hidden"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Trang chủ
        </Link>

        {/* Mobile logo */}
        <div className="mb-6 flex flex-col items-center gap-2 lg:hidden">
          <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-3 shadow-sm">
            <Logo size={52} />
          </div>
          <p className="text-xs font-bold text-[#7A6F68]">PBVM SHOP</p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-[400px] rounded-2xl border border-[#E6DFD9] bg-white p-8 shadow-lg">
          {children}
        </div>
      </div>
    </div>
  );
}
