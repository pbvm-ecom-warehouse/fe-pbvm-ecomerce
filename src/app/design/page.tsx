"use client";

import React, { useState } from "react";
import { Sparkles, Info, HelpCircle, ShieldCheck, Truck } from "lucide-react";
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
    <main className="mx-auto w-full max-w-7xl px-4 py-8">
      {/* Banner Tiêu đề & Giới thiệu */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#5C3D2E] to-[#4A2E22] p-6 text-white md:p-8 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#D2B48C]/20 px-3 py-1 text-xs font-semibold text-[#D2B48C] backdrop-blur-sm mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Tính năng mới: Thiết kế 3D tương tác & Trợ lý AI
          </div>
          <h1 className="text-2xl font-bold md:text-3xl tracking-tight">
            XƯỞNG TỰ THIẾT KẾ LY THƯƠNG HIỆU
          </h1>
          <p className="mt-2 text-sm text-[#EFEAE4]/90 font-medium">
            Tự do thiết kế logo của riêng bạn hoặc sử dụng Trợ lý AI thông minh để kiến tạo các mẫu in độc quyền chỉ trong vài giây. Quan sát trực quan toàn diện 360 độ góc nhìn thực tế của cốc trước khi đặt sản xuất hàng loạt.
          </p>
        </div>
      </div>

      {/* Grid Layout chính */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Cột trái: Trình diễn 3D */}
        <div className="lg:col-span-7 flex flex-col gap-4 sticky top-24">
          <div className="rounded-2xl border border-[#E6DFD9] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-bold text-[#5C3D2E] uppercase tracking-wider">Mô hình ly 3D trực quan</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                Live Preview
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#E6DFD9] bg-white p-3.5 flex items-start gap-2.5">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#5C3D2E]">Cam kết chất lượng</h4>
                <p className="text-[10px] text-[#7A6F68] mt-0.5 leading-relaxed">Mực in sinh học an toàn vệ sinh thực phẩm, không phai màu.</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E6DFD9] bg-white p-3.5 flex items-start gap-2.5">
              <Truck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#5C3D2E]">Sản xuất nhanh chóng</h4>
                <p className="text-[10px] text-[#7A6F68] mt-0.5 leading-relaxed">Đơn hàng in tùy chỉnh hoàn thiện và giao hàng từ 3-5 ngày làm việc.</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E6DFD9] bg-white p-3.5 flex items-start gap-2.5">
              <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#5C3D2E]">Hỗ trợ kỹ thuật in</h4>
                <p className="text-[10px] text-[#7A6F68] mt-0.5 leading-relaxed">Kỹ thuật viên sẽ kiểm tra lại độ phân giải trước khi tiến hành in hàng loạt.</p>
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
      <section className="mt-12 rounded-2xl border border-[#E6DFD9] bg-[#FAF8F6] p-6 md:p-8">
        <h3 className="text-base font-bold text-[#5C3D2E] mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-primary" />
          Hướng dẫn & Quy trình in cốc nhựa theo yêu cầu
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="text-2xl font-bold text-primary/50">01.</div>
            <h4 className="text-xs font-bold text-[#5C3D2E]">Thiết kế & Xem trước</h4>
            <p className="text-xs text-[#7A6F68] leading-relaxed">
              Sử dụng bảng điều khiển phía trên để lựa chọn size cốc (S, M, L, XL), chất liệu nhựa trong suốt, nhựa mờ hoặc cốc giấy. Định vị logo hoặc tạo ảnh in bằng AI.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="text-2xl font-bold text-primary/50">02.</div>
            <h4 className="text-xs font-bold text-[#5C3D2E]">Đặt hàng & Thống nhất</h4>
            <p className="text-xs text-[#7A6F68] leading-relaxed">
              Sau khi chọn "Thêm vào giỏ hàng", kiểm tra cấu hình trong giỏ hàng. PBVM Shop sẽ liên hệ với bạn để xác nhận đơn hàng và thống nhất số lượng đặt (từ 1,000 ly).
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="text-2xl font-bold text-primary/50">03.</div>
            <h4 className="text-xs font-bold text-[#5C3D2E]">Chế bản & In thử</h4>
            <p className="text-xs text-[#7A6F68] leading-relaxed">
              Chúng tôi sẽ xuất file in vector sắc nét từ logo của bạn, dựng bản in chính xác lên khuôn và tiến hành in thử mẫu thực tế gửi hình ảnh phê duyệt cho bạn.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="text-2xl font-bold text-primary/50">04.</div>
            <h4 className="text-xs font-bold text-[#5C3D2E]">Sản xuất & Giao hàng</h4>
            <p className="text-xs text-[#7A6F68] leading-relaxed">
              Tiến hành in hàng loạt trên dây chuyền in tự động hiện đại. Sản phẩm được sấy khô tia cực tím khử trùng tuyệt đối, đóng thùng carton chống bóp méo và giao tận nơi.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
