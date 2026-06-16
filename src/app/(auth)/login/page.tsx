import Link from "next/link";
import { ArrowRight, LockKeyhole, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#FAF8F6] px-4 py-10 text-[#1C1917]">
      <Card className="w-full max-w-md overflow-hidden rounded-2xl border-[#E6DFD9] bg-white p-0 shadow-sm">
        <CardHeader className="border-b border-[#E6DFD9]/70 bg-[#FAF8F6] p-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserRound className="size-6" />
          </div>
          <CardTitle className="mt-3 text-2xl font-black tracking-normal">
            Đăng nhập
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-[#7A6F68]">
            Truy cập tài khoản shop trà sữa B2B hoặc khách lẻ B2C.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black text-primary">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="shop@example.com"
                className="h-11 rounded-xl border-[#E6DFD9] bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs font-black text-primary"
              >
                Mật khẩu
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-11 rounded-xl border-[#E6DFD9] bg-white"
              />
            </div>
            <Button
              asChild
              className="h-11 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#4A2E22]"
            >
              <Link href="/account">
                <LockKeyhole data-icon="inline-start" />
                Đăng nhập
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <p className="text-center text-xs text-[#7A6F68]">
              Chưa có tài khoản?{" "}
              <Link href="/register" className="font-black text-primary">
                Đăng ký B2B
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
