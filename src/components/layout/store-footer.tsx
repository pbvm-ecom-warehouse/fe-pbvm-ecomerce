"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock,
  CreditCard,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  ShieldCheck,
  Truck,
  Undo2,
} from "lucide-react";

import { Logo } from "@/components/ui/logo";

const valueProps = [
  {
    icon: PackageCheck,
    title: "Catalog đồng bộ WMS",
    desc: "Giá, SKU và tồn kho bám theo dữ liệu vận hành hiện tại.",
  },
  {
    icon: Truck,
    title: "Giao sỉ linh hoạt",
    desc: "Hỗ trợ chành xe, nội thành và các đơn hàng định kỳ.",
  },
  {
    icon: ShieldCheck,
    title: "Ly in có kiểm soát",
    desc: "Ly custom luôn kèm mẫu thiết kế trước khi mở lệnh in.",
  },
  {
    icon: Undo2,
    title: "Hỗ trợ sau bán",
    desc: "Đổi trả theo chính sách cho hàng lỗi hoặc sai quy cách.",
  },
];

const footerColumns = [
  {
    title: "Mua hàng",
    links: [
      { href: "/products", label: "Danh mục sản phẩm" },
      { href: "/design-cup", label: "Thiết kế ly custom" },
      { href: "/about", label: "Giới thiệu PBVM" },
      { href: "/cart", label: "Giỏ hàng" },
      { href: "/checkout", label: "Checkout" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { href: "/account", label: "Tài khoản của tôi" },
      { href: "/orders", label: "Đơn hàng" },
      { href: "/login", label: "Đăng nhập" },
      { href: "/register", label: "Đăng ký" },
    ],
  },
  {
    title: "Thanh toán",
    links: [
      { href: "/checkout", label: "Thanh toán online (PayOS)" },
      { href: "/checkout", label: "COD cho hàng sẵn" },
    ],
  },
];

export function StoreFooter() {
  const pathname = usePathname();

  if (pathname?.startsWith("/design-cup")) {
    return null;
  }
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = !mounted || !pathname || ["/login", "/register"].includes(pathname) || pathname.startsWith("/admin");
  
  if (isAuthPage) {
    return null;
  }

  return (
    <footer className="w-full border-t border-border bg-muted text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
        <div className="mt-10 grid gap-8 border-t border-border pt-10 md:grid-cols-[1.3fr_2fr]">
          <div className="space-y-4">
            <Link href="/" className="flex w-fit items-center gap-3">
              <div className="rounded-xl border border-border bg-white p-1.5 shadow-sm">
                <Logo size={42} />
              </div>
              <div>
                <div className="text-lg font-black leading-none">
                  PBVM SHOP
                </div>
                <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                  Logistics & Ecom
                </div>
              </div>
            </Link>
            <p className="max-w-md text-xs leading-6 text-muted-foreground">
              Nền tảng đặt hàng nguyên liệu trà sữa, ly nhựa và ly in riêng cho
              shop F&B. Từ chọn sản phẩm, thiết kế ly đến thanh toán đều nằm
              trong một luồng mua hàng gọn.
            </p>
            <div className="grid gap-2 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>97 Đường số 7, KDC Trung Sơn, Bình Chánh, TP.HCM</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-primary" />
                <span>Hotline: 1900-8888</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-primary" />
                <span>support@pbvm.example</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 text-primary" />
                <span>Thứ 2 - Thứ 7, 08:00 - 17:30</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <h3 className="text-xs font-black uppercase tracking-[0.16em] text-primary">
                  {column.title}
                </h3>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {column.links.map((link) => (
                    <li key={`${column.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 PBVM Shop. All rights reserved.</span>
          <span className="inline-flex items-center gap-2">
            <CreditCard className="size-4 text-primary" />
            Ly custom thanh toán online
          </span>
        </div>
      </div>
    </footer>
  );
}
