"use client";

import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrder } from "@/features/order/services/order.service";
import { formatCurrency } from "@/utils/format-currency";
import { formatDateTime } from "@/utils/format-date";

export function OrderDetailClient({ orderId }: { orderId: string }) {
  const orderQuery = useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(orderId),
    enabled: orderId.length > 0,
  });

  const order = orderQuery.data;

  if (orderQuery.isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Đang tải đơn hàng...
        </CardContent>
      </Card>
    );
  }

  if (orderQuery.isError || !order) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Chưa kết nối được ecommerce-api hoặc không tìm thấy đơn hàng.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <Badge variant="secondary">{order.status}</Badge>
        <CardTitle>{order.id}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Kho xuất</span>
          <span className="font-medium">{order.warehouseName}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Ngày tạo</span>
          <span>{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="flex justify-between gap-3 border-t pt-3">
          <span className="text-muted-foreground">Tổng tiền</span>
          <span className="font-semibold">
            {formatCurrency(order.totalAmount)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
