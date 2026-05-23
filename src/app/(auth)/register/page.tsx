import Link from "next/link";

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
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-md place-items-center px-4 py-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Đăng ký khách hàng</CardTitle>
          <CardDescription>
            B2B có thể nhận bảng giá riêng sau khi backend duyệt hồ sơ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên khách hàng</Label>
              <Input id="name" placeholder="Trà sữa Bảo Bảo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="owner@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" placeholder="0900000000" />
            </div>
            <Button asChild className="w-full">
              <Link href="/account">Tạo tài khoản</Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
