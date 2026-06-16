import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#FAF8F6] px-4 py-10 text-[#1C1917]">
      <Card className="w-full max-w-md overflow-hidden rounded-2xl border-[#E6DFD9] bg-white p-0 shadow-sm">
        <CardHeader className="border-b border-[#E6DFD9]/70 bg-[#FAF8F6] p-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-6" />
          </div>
          <CardTitle className="mt-3 text-2xl font-black tracking-normal">
            Đăng ký khách hàng
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-[#7A6F68]">
            B2B có thể nhận bảng giá riêng sau khi backend duyệt hồ sơ.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-black text-primary">
                Tên khách hàng
              </Label>
              <Input
                id="name"
                placeholder="Trà sữa PBVM"
                className="h-11 rounded-xl border-[#E6DFD9] bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black text-primary">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="owner@example.com"
                className="h-11 rounded-xl border-[#E6DFD9] bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-black text-primary">
                Số điện thoại
              </Label>
              <Input
                id="phone"
                placeholder="0900000000"
                className="h-11 rounded-xl border-[#E6DFD9] bg-white"
              />
            </div>
            <Button
              asChild
              className="h-11 w-full rounded-xl bg-primary font-bold text-white hover:bg-[#4A2E22]"
            >
              <Link href="/account">
                Tạo tài khoản
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <p className="text-center text-xs text-[#7A6F68]">
              Đã có tài khoản?{" "}
              <Link href="/login" className="font-black text-primary">
                Đăng nhập
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
