import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AccountPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Tài khoản khách hàng</CardTitle>
          <CardDescription>
            Quản lý thông tin B2B/B2C, địa chỉ giao hàng và lịch sử mua.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button asChild>
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">Đăng ký</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
