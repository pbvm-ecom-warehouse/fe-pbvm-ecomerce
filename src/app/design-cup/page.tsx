import { Suspense } from "react";
import { CupDesignerPage } from "@/features/cup-designer/components/cup-designer-page";

export default function DesignCupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 rounded-full border-4 border-emerald-200 border-t-primary animate-spin" />
            <p className="text-xs font-bold text-slate-500">Đang tải Trình thiết kế 3D...</p>
          </div>
        </div>
      }
    >
      <CupDesignerPage />
    </Suspense>
  );
}
