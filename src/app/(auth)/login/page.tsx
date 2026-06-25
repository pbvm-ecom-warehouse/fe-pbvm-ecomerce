"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  return (
    <div className="flex flex-col">
      {/* Header section with centered logo */}
      <div className="flex flex-col items-center text-center mb-7">
        <div className="mb-3 transition-transform hover:scale-105 duration-300">
          <Logo size={60} />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-[#253D4E]">
          Đăng nhập tài khoản
        </h1>
        <p className="text-xs text-[#78858F] font-semibold mt-1 max-w-[280px]">
          Theo dõi tình hình kinh doanh và quản lý đơn hàng B2B
        </p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        {/* Google sign-in button matching mockup */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-600 transition-all flex items-center justify-center cursor-pointer shadow-sm active:scale-[0.99]"
        >
          <GoogleIcon />
          Tiếp tục với Google
        </Button>

        {/* Custom text divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-100"></div>
          <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">
            hoặc Đăng nhập bằng Email
          </span>
          <div className="flex-grow border-t border-slate-100"></div>
        </div>

        {/* Clean, icon-free fields matching the mockup */}
        <div className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold text-[#78858F] tracking-wide">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="mail@abc.com"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#253D4E] transition-all placeholder:text-slate-300 focus:border-[#3BB77E] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold text-[#78858F] tracking-wide">
              Mật khẩu
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-[#253D4E] transition-all placeholder:text-slate-300 focus:border-[#3BB77E] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
            />
          </div>
        </div>

        {/* Remember me & forgot password row */}
        <div className="flex items-center justify-between text-xs font-bold pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-[#78858F] hover:text-[#253D4E] transition-colors select-none">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-[#3BB77E] focus:ring-[#3BB77E] h-3.5 w-3.5 accent-[#3BB77E]"
            />
            Ghi nhớ đăng nhập
          </label>
          <Link href="#" className="text-rose-600 hover:text-rose-700 hover:underline">
            Quên mật khẩu?
          </Link>
        </div>

        {/* Main action button */}
        <Button
          asChild
          className="h-11 w-full rounded-xl bg-[#3BB77E] hover:bg-[#34a370] active:scale-[0.98] font-bold text-white shadow-md shadow-emerald-500/5 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Link href="/account">
            Đăng nhập
          </Link>
        </Button>

        {/* Footer link */}
        <p className="text-center text-xs text-[#78858F] font-semibold pt-2">
          Chưa đăng ký?{" "}
          <Link href="/register" className="font-bold text-[#3BB77E] hover:underline">
            Tạo tài khoản B2B
          </Link>
        </p>
      </form>
    </div>
  );
}
