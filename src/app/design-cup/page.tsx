import { CupDesignerClient } from "@/features/cup-designer/components/cup-designer-client";

export default function DesignCupPage() {
  return (
    <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            CUSTOM_PRINT
          </p>
          <h1 className="text-2xl font-semibold tracking-normal">
            Thiết kế ly custom
          </h1>
          <p className="text-sm text-muted-foreground">
            Tạo artwork 2D, kiểm tra preview ly và thêm vào giỏ với designFile.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs md:w-[360px]">
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="font-semibold">2D</div>
            <div className="text-muted-foreground">source</div>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="font-semibold">3D</div>
            <div className="text-muted-foreground">preview</div>
          </div>
          <div className="rounded-lg border bg-muted/30 px-3 py-2">
            <div className="font-semibold">Online</div>
            <div className="text-muted-foreground">payment</div>
          </div>
        </div>
      </div>
      <CupDesignerClient />
    </main>
  );
}
