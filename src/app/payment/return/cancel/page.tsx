"use client";

import { Suspense } from "react";
import { PaymentCancelContent } from "@/features/payment/components/payment-cancel-content";

export default function PaymentReturnCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
          <p className="text-sm font-medium text-muted-foreground">Đang tải thông tin trang...</p>
        </div>
      }
    >
      <PaymentCancelContent />
    </Suspense>
  );
}
