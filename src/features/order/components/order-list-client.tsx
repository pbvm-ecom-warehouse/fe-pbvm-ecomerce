"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listOrders } from "@/features/order/services/order.service";
import { formatCurrency } from "@/utils/format-currency";
import { formatDateTime } from "@/utils/format-date";

export function OrderListClient() {
  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: listOrders,
  });

  const orders = ordersQuery.data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đơn hàng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ordersQuery.isLoading ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Đang tải đơn hàng...
          </div>
        ) : null}

        {ordersQuery.isError ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Chưa kết nối được ecommerce-api hoặc phiên đăng nhập đã hết hạn.
          </div>
        ) : null}

        {!ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Chưa có đơn hàng.
          </div>
        ) : null}

        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="block rounded-lg border p-3 hover:bg-muted/50"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">{order.id}</div>
              <Badge variant="secondary">{order.status}</Badge>
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {order.warehouseName} · {formatDateTime(order.createdAt)}
            </div>
            <div className="mt-2 font-semibold">
              {formatCurrency(order.totalAmount)}
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
