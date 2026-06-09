import Link from "next/link";
import { User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <div className="flex flex-col gap-5">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#1C1917]">Tạo tài khoản mới</h2>
        <p className="mt-1 text-xs text-[#7A6F68]">
          Đăng ký để đặt hàng trực tiếp và nhận báo giá ưu đãi sỉ.
        </p>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-3.5">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name" className="text-xs font-semibold text-[#1C1917]">
            Tên đại lý / Khách hàng
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6F68]" />
            <Input
              id="name"
              placeholder="Trà sữa Bảo Bảo"
              className="pl-9 h-10 border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary text-sm"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-[#1C1917]">
            Địa chỉ Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6F68]" />
            <Input
              id="email"
              type="email"
              placeholder="owner@example.com"
              className="pl-9 h-10 border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary text-sm"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone" className="text-xs font-semibold text-[#1C1917]">
            Số điện thoại
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6F68]" />
            <Input
              id="phone"
              placeholder="0900 000 000"
              className="pl-9 h-10 border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="reg-password" className="text-xs font-semibold text-[#1C1917]">
            Mật khẩu
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6F68]" />
            <Input
              id="reg-password"
              type="password"
              placeholder="Tối thiểu 8 ký tự"
              className="pl-9 h-10 border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary text-sm"
            />
          </div>
        </div>

        {/* Terms */}
        <p className="text-[11px] text-[#7A6F68] leading-relaxed">
          Bằng việc đăng ký, bạn đồng ý với{" "}
          <Link href="#" className="font-semibold text-primary hover:underline">Điều khoản dịch vụ</Link>
          {" "}và{" "}
          <Link href="#" className="font-semibold text-primary hover:underline">Chính sách bảo mật</Link>.
        </p>

        {/* Submit */}
        <Button
          asChild
          className="mt-1 h-11 w-full text-sm font-semibold shadow-md group"
        >
          <Link href="/" className="flex items-center justify-center gap-2">
            Tạo tài khoản
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </form>

      {/* Login link */}
      <div className="border-t border-[#E6DFD9]/70 pt-4 text-center">
        <p className="text-xs text-[#7A6F68]">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
