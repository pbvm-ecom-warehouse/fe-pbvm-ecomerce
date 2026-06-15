"use client";

import React, { useState } from "react";
import { Sparkles, Info, HelpCircle, ShieldCheck, Truck, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { CupVisualizer3D } from "@/features/design/components/cup-visualizer-3d";
import { DesignControls } from "@/features/design/components/design-controls";

export default function DesignPage() {
  // Trạng thái cấu hình của ly 3D
  const [size, setSize] = useState<"S" | "M" | "L" | "XL">("M");
  const [style, setStyle] = useState<"straight" | "u_shape" | "heart" | "mug">("straight");
  const [materialType, setMaterialType] = useState<"clear" | "frosted" | "paper" | "glass" | "metal">("clear");
  const [cupColor, setCupColor] = useState<string>("#FFFFFF");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  
  // Trạng thái trung chuyển ảnh vẽ từ controls sang bảng vẽ 2D
  const [triggerDrawImg, setTriggerDrawImg] = useState<string | null>(null);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 flex flex-col gap-6 bg-[#FAF8F6] dark:bg-[#1C1816] min-h-screen">
      {/* Back button */}
      <div>
        <Link href="/" className="inline-flex items-center gap-1 text-xs font-bold text-[#7A6F68] hover:text-primary transition-colors">
          <ArrowLeft className="size-3.5" /> Quay lại Trang chủ
        </Link>
      </div>

      {/* Banner Tiêu đề & Giới thiệu */}
      <div className="rounded-3xl bg-gradient-to-br from-[#5C3D2E] to-[#4A2E22] p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-4xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 border border-white/20 px-3.5 py-1 text-xs font-bold text-[#D7C4B7] backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            3D Studio & AI Generator
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            XƯỞNG TỰ THIẾT KẾ LY THƯƠNG HIỆU
          </h1>
          <p className="text-xs sm:text-sm text-[#EFEAE4]/80 leading-relaxed max-w-3xl">
            Tự do thiết kế logo của riêng bạn hoặc sử dụng Trợ lý AI thông minh để kiến tạo các mẫu in độc quyền chỉ trong vài giây. Quan sát trực quan toàn diện 360 độ góc nhìn thực tế của cốc trước khi đặt sản xuất hàng loạt.
          </p>
        </div>
      </div>

      {/* Grid Layout chính */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Cột trái: Trình diễn 3D */}
        <div className="lg:col-span-7 flex flex-col gap-6 sticky top-24">
          <div className="rounded-3xl border border-[#E6DFD9] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                Mô hình ly 3D trực quan
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                Live 3D Render
              </span>
            </div>
            
            <CupVisualizer3D
              size={size}
              style={style}
              materialType={materialType}
              cupColor={cupColor}
              logoUrl={logoUrl}
              isScanning={isScanning}
            />
          </div>

          {/* Các thông tin hướng dẫn thiết kế */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-[#E6DFD9] bg-white p-4 flex items-start gap-3 shadow-xs">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#5C3D2E]">Cam kết in sắc nét</h4>
                <p className="text-[10px] text-[#7A6F68] mt-1 leading-relaxed">Sử dụng mực in chất lượng tốt nhất, cam kết không bong tróc, không phai màu.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E6DFD9] bg-white p-4 flex items-start gap-3 shadow-xs">
              <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#5C3D2E]">Sản xuất nhanh chóng</h4>
                <p className="text-[10px] text-[#7A6F68] mt-1 leading-relaxed">Đơn hàng in tùy chỉnh hoàn thiện và bàn giao chành xe từ 3-5 ngày.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-[#E6DFD9] bg-white p-4 flex items-start gap-3 shadow-xs">
              <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#5C3D2E]">Hỗ trợ chế bản miễn phí</h4>
                <p className="text-[10px] text-[#7A6F68] mt-1 leading-relaxed">Kỹ thuật viên sẽ đồ lại logo vector độ nét cao cho bạn trước khi in hàng loạt.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Bảng điều khiển công cụ thiết kế */}
        <div className="lg:col-span-5">
          <DesignControls
            size={size}
            setSize={setSize}
            style={style}
            setStyle={setStyle}
            materialType={materialType}
            setMaterialType={setMaterialType}
            cupColor={cupColor}
            setCupColor={setCupColor}
            logoUrl={logoUrl}
            setLogoUrl={setLogoUrl}
            isScanning={isScanning}
            setIsScanning={setIsScanning}
            triggerDrawImg={triggerDrawImg}
            setTriggerDrawImg={setTriggerDrawImg}
          />
        </div>
      </div>

      {/* Thông tin mở rộng về quy trình và báo giá */}
      <section className="rounded-3xl border border-[#E6DFD9] bg-[#FAF8F6] p-8 mt-4">
        <h3 className="text-sm font-bold text-[#5C3D2E] mb-6 flex items-center gap-2 uppercase tracking-wider">
          <Info className="h-5 w-5 text-primary" />
          Quy trình in cốc nhựa theo yêu cầu tại PBVM
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white border border-[#E6DFD9]/40">
            <div className="text-3xl font-black text-primary/30 font-mono">01.</div>
            <h4 className="text-xs font-bold text-[#5C3D2E]">Thiết kế & Xem trước</h4>
            <p className="text-[11px] text-[#7A6F68] leading-relaxed">
              Sử dụng Studio 3D phía trên để chọn size cốc, chất liệu nhựa trong/nhựa mờ hoặc cốc giấy. Định vị logo hoặc sử dụng AI vẽ ý tưởng.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white border border-[#E6DFD9]/40">
            <div className="text-3xl font-black text-primary/30 font-mono">02.</div>
            <h4 className="text-xs font-bold text-[#5C3D2E]">Đặt hàng & Xác nhận</h4>
            <p className="text-[11px] text-[#7A6F68] leading-relaxed">
              Thêm vào giỏ hàng và tiến hành checkout. Nhân viên xưởng in PBVM sẽ liên hệ với bạn qua điện thoại để thống nhất số lượng in và chốt maket.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white border border-[#E6DFD9]/40">
            <div className="text-3xl font-black text-primary/30 font-mono">03.</div>
            <h4 className="text-xs font-bold text-[#5C3D2E]">Chế bản & In thử</h4>
            <p className="text-[11px] text-[#7A6F68] leading-relaxed">
              Chúng tôi sẽ xuất file in vector chất lượng cực cao từ logo của bạn, chế bản và tiến hành in thử mẫu thực tế gửi hình ảnh xác nhận.
            </p>
          </div>

          <div className="flex flex-col gap-2 p-4 rounded-2xl bg-white border border-[#E6DFD9]/40">
            <div className="text-3xl font-black text-primary/30 font-mono">04.</div>
            <h4 className="text-xs font-bold text-[#5C3D2E]">Sản xuất & Bàn giao</h4>
            <p className="text-[11px] text-[#7A6F68] leading-relaxed">
              Hệ thống in tự động chạy hàng loạt, khử trùng bằng UV tuyệt đối. Cốc được đóng thùng các-tông dày dặn và giao tới tay khách hàng chành xe.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
