import Link from "next/link";
import { ShieldCheck, Truck, Percent, Gift, Undo2, Phone, Mail, MapPin, Clock } from "lucide-react";

import { Logo } from "@/components/ui/logo";

export function StoreFooter() {
  const valueProps = [
    {
      icon: Percent,
      title: "Giá tốt nhất & Ưu đãi sỉ",
      desc: "Chiết khấu cực tốt cho đại lý & quán trà sữa",
    },
    {
      icon: Truck,
      title: "Vận chuyển nhanh chóng",
      desc: "Giao hàng từ 2-3 ngày, hỗ trợ freeship",
    },
    {
      icon: Gift,
      title: "Khuyến mãi hàng ngày",
      desc: "Ưu đãi đặc biệt khi đặt hàng qua app",
    },
    {
      icon: ShieldCheck,
      title: "Đa dạng & Chính hãng",
      desc: "Nguồn nguyên liệu sạch 100% kiểm định",
    },
    {
      icon: Undo2,
      title: "Hỗ trợ đổi trả dễ dàng",
      desc: "Bảo hành in lỗi, đổi trả trong 7 ngày",
    },
  ];

  return (
    <footer className="w-full bg-[#FAF8F6] border-t border-[#E6DFD9] mt-16 text-[#1C1917]">
      {/* Value Propositions Row */}
      <div className="mx-auto max-w-7xl px-4 py-8 border-b border-[#E6DFD9]/60">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {valueProps.map((prop, idx) => {
            const Icon = prop.icon;
            return (
              <div key={idx} className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm border border-[#E6DFD9]/40 hover:-translate-y-1 hover:shadow-md transition-all duration-300">
                <div className="rounded-full bg-primary/10 p-3 text-primary shrink-0">
                  <Icon className="size-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">{prop.title}</h4>
                  <p className="text-[10px] text-[#7A6F68] mt-1">{prop.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Logo & Contact */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="rounded-xl bg-white p-1.5 shadow-sm border border-[#E6DFD9]/80">
                <Logo size={42} />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight text-[#1C1917]">PBVM SHOP</div>
                <div className="text-[10px] font-semibold text-primary uppercase tracking-wider">Logistics & Ecom</div>
              </div>
            </Link>
            <p className="text-xs text-[#7A6F68] leading-relaxed">
              Nhà phân phối nguyên liệu trà sữa, bột kem sữa béo và in ly nhựa PP/PET hàng đầu miền Nam.
            </p>
            <div className="space-y-2.5 text-xs text-[#7A6F68]">
              <div className="flex items-start gap-2">
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <span>Số 97, Đường số 7, KDC Trung Sơn, Bình Hưng, Bình Chánh, TP.HCM</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-primary shrink-0" />
                <span>Hotline: 1900-8888 (08:00 - 21:00)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-primary shrink-0" />
                <span>Email: support@pbvm.example</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary shrink-0" />
                <span>Giờ làm việc: Thứ 2 - Thứ Bảy / 08:00 - 17:30</span>
              </div>
            </div>
          </div>

          {/* Column 2: Company */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wide uppercase text-primary">Về PBVM</h4>
            <ul className="space-y-2 text-xs text-[#7A6F68]">
              <li><Link href="#" className="hover:text-primary hover:underline">Giới thiệu công ty</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Thông tin giao nhận</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Chính sách bảo mật</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Điều khoản dịch vụ</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Liên hệ</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Hệ thống kho hàng</Link></li>
            </ul>
          </div>

          {/* Column 3: Account */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wide uppercase text-primary">Tài khoản</h4>
            <ul className="space-y-2 text-xs text-[#7A6F68]">
              <li><Link href="/account" className="hover:text-primary hover:underline">Đăng nhập</Link></li>
              <li><Link href="/cart" className="hover:text-primary hover:underline">Xem giỏ hàng</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Danh sách yêu thích</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Theo dõi đơn hàng</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Bảng giá B2B của bạn</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Đánh giá sản phẩm</Link></li>
            </ul>
          </div>

          {/* Column 4: Corporate */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wide uppercase text-primary">Hợp tác</h4>
            <ul className="space-y-2 text-xs text-[#7A6F68]">
              <li><Link href="#" className="hover:text-primary hover:underline">Trở thành nhà cung cấp</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Đăng ký đại lý sỉ</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Hệ thống nhượng quyền</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Chương trình liên kết</Link></li>
              <li><Link href="#" className="hover:text-primary hover:underline">Tuyển dụng</Link></li>
            </ul>
          </div>

          {/* Column 5: App & Pay */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold tracking-wide uppercase text-primary">Cài đặt ứng dụng</h4>
            <p className="text-[11px] text-[#7A6F68]">Tải app của chúng tôi trên App Store hoặc Google Play</p>
            <div className="flex flex-col gap-2">
              <div className="rounded-lg bg-[#1C1917] p-2 flex items-center gap-2 text-white border border-white/5 cursor-pointer hover:bg-neutral-800 transition-colors">
                <div className="text-[8px] uppercase tracking-wider text-gray-400">Download on the</div>
                <div className="text-[11px] font-semibold font-sans -mt-1 leading-tight">App Store</div>
              </div>
              <div className="rounded-lg bg-[#1C1917] p-2 flex items-center gap-2 text-white border border-white/5 cursor-pointer hover:bg-neutral-800 transition-colors">
                <div className="text-[8px] uppercase tracking-wider text-gray-400">Get it on</div>
                <div className="text-[11px] font-semibold font-sans -mt-1 leading-tight">Google Play</div>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-[10px] text-[#7A6F68] font-semibold">Cổng thanh toán bảo mật</p>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                <span className="rounded bg-white border border-[#E6DFD9] px-1.5 py-0.5 text-[9px] font-bold text-[#1C1917] shadow-sm">Visa</span>
                <span className="rounded bg-white border border-[#E6DFD9] px-1.5 py-0.5 text-[9px] font-bold text-[#1C1917] shadow-sm">MasterCard</span>
                <span className="rounded bg-white border border-[#E6DFD9] px-1.5 py-0.5 text-[9px] font-bold text-[#1C1917] shadow-sm">Momo</span>
                <span className="rounded bg-white border border-[#E6DFD9] px-1.5 py-0.5 text-[9px] font-bold text-[#1C1917] shadow-sm">Chuyển khoản</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-[#E6DFD9]/60 bg-[#F4EFEA] py-6 text-center text-xs text-[#7A6F68]">
        <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} PBVM Shop. Toàn bộ thiết kế theo chuẩn Figma Landing Page.</p>
          <p className="flex gap-4">
            <Link href="#" className="hover:underline">Điều khoản bảo mật</Link>
            <Link href="#" className="hover:underline">Quy chế hoạt động</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
