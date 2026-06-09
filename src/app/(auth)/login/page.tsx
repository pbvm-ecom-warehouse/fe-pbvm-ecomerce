import Link from "next/link";
import { User, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-5">
      {/* Heading */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#1C1917]">Chào mừng trở lại</h2>
        <p className="mt-1 text-xs text-[#7A6F68]">
          Đăng nhập để đặt hàng nhanh và xem báo giá sỉ B2B.
        </p>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email" className="text-xs font-semibold text-[#1C1917]">
            Địa chỉ Email
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6F68]" />
            <Input
              id="email"
              type="email"
              placeholder="shop@example.com"
              className="pl-9 h-10 border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold text-[#1C1917]">
              Mật khẩu
            </Label>
            <Link href="#" className="text-[11px] font-medium text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A6F68]" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-9 h-10 border-[#E6DFD9] focus-visible:ring-primary focus-visible:border-primary text-sm"
            />
          </div>
        </div>

        {/* Remember me */}
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#E6DFD9] accent-primary"
          />
          <span className="text-xs text-[#7A6F68]">Duy trì đăng nhập trên thiết bị này</span>
        </label>

        {/* Submit */}
        <Button
          asChild
          className="mt-1 h-11 w-full text-sm font-semibold shadow-md group"
        >
          <Link href="/" className="flex items-center justify-center gap-2">
            Đăng nhập
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </form>

      {/* Divider + Register link */}
      <div className="border-t border-[#E6DFD9]/70 pt-4 text-center">
        <p className="text-xs text-[#7A6F68]">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
