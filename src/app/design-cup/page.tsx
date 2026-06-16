import { CupDesignerClient } from "@/features/cup-designer/components/cup-designer-client";

export default function DesignCupPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F6] px-4 py-8 text-[#1C1917] lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-[#E6DFD9] bg-white px-5 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-primary">
            Ly in custom
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-normal">
              Thiết kế ly custom
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#7A6F68]">
              Tạo artwork 2D, kiểm tra preview ly và thêm vào giỏ với mẫu đã lưu.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs md:w-[380px]">
            <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] px-3 py-3">
              <div className="font-black text-primary">2D</div>
              <div className="mt-1 text-[#7A6F68]">vùng in</div>
            </div>
            <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] px-3 py-3">
              <div className="font-black text-primary">3D</div>
              <div className="mt-1 text-[#7A6F68]">preview</div>
            </div>
            <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] px-3 py-3">
              <div className="font-black text-primary">Online</div>
              <div className="mt-1 text-[#7A6F68]">payment</div>
            </div>
          </div>
        </div>
        <CupDesignerClient />
      </div>
    </main>
  );
}
