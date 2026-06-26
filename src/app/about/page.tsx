import Image from "next/image";
import Link from "next/link";
import { Award, Clock, Cpu, Layers, Paintbrush, ShieldCheck, Sparkles, Target, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Về PBVM | Bao bì & Nguyên liệu B2B",
  description: "Tìm hiểu về PBVM - giải pháp cung cấp ly nhựa in thương hiệu và nguyên liệu trà sữa sỉ trọn gói, đồng bộ kho WMS cho chuỗi F&B.",
};

export default function AboutPage() {
  const stats = [
    { value: "5Tr+", label: "Ly in đã xuất xưởng", description: "Bao gồm ly nhựa PP, PET, ly giấy và màng dập cốc" },
    { value: "500+", label: "Chuỗi cửa hàng đồng hành", description: "Cung cấp sỉ trọn gói cho các thương hiệu F&B Việt Nam" },
    { value: "99.8%", label: "Giao hàng đúng hẹn", description: "Quy trình vận hành logistics tối ưu qua chành xe & nội thành" },
    { value: "24/7", label: "Tự phục vụ thiết kế 3D", description: "Thiết kế logo trực quan, xoay 360 độ trực tuyến miễn phí" },
  ];

  const pillars = [
    {
      title: "Tầm nhìn chiến lược",
      text: "Trở thành người bạn đồng hành số 1 của các thương hiệu trà sữa và cà phê tại Việt Nam, số hóa chuỗi cung ứng bao bì và nguyên liệu sỉ để giúp các doanh nghiệp F&B tối ưu hóa vận hành từ khâu thiết kế đến giao nhận.",
      icon: Layers,
    },
    {
      title: "Sứ mệnh cốt lõi",
      text: "Đơn giản hóa quy trình mua sắm vật tư B2B bằng cách tích hợp dịch vụ thiết kế ly nhựa in logo 3D trực quan và quản lý tồn kho theo thời gian thực (WMS), mang lại trải nghiệm minh bạch, nhanh chóng và chuẩn xác.",
      icon: Target,
    },
  ];

  const features = [
    {
      title: "Thiết kế ly 3D tương tác",
      description: "Công cụ thiết kế trực tuyến cho phép bạn tải logo lên ly, điều chỉnh kích cỡ và quan sát mô hình 3D thực tế trước khi đặt in.",
      icon: Paintbrush,
    },
    {
      title: "Đồng bộ tồn kho WMS",
      description: "Hệ thống kết nối trực tiếp với phần mềm quản lý kho (WMS), cập nhật số lượng tồn chính xác để bạn luôn chủ động kế hoạch kinh doanh.",
      icon: Cpu,
    },
    {
      title: "Chất lượng in sắc nét",
      description: "Sử dụng công nghệ in hiện đại và mực in cao cấp, cam kết logo hiển thị sắc nét, chuẩn màu và không bong tróc.",
      icon: Award,
    },
    {
      title: "Đầy đủ chứng nhận ATVSTP",
      description: "Toàn bộ nguyên liệu pha chế và bao bì nhựa đều đạt tiêu chuẩn vệ sinh an toàn thực phẩm, có giấy tờ xuất xứ rõ ràng.",
      icon: ShieldCheck,
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-[#0b1310] text-foreground">
      {/* Section 1: Hero Split Layout */}
      <section className="relative overflow-hidden py-12 md:py-20 lg:py-24 border-b border-[#E2EDE8] dark:border-zinc-800/80">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DEF9EC] dark:bg-[#1b3d2f] text-[#3BB77E] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="size-3.5" /> Về chúng tôi
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-[#253D4E] dark:text-zinc-100">
                Giải pháp bao bì & nguyên liệu sỉ <span className="text-[#3BB77E] italic">chuẩn hóa cho chuỗi F&B</span>
              </h1>

              <p className="text-base text-muted-foreground dark:text-zinc-300 leading-relaxed max-w-[58ch]">
                Được thành lập từ trăn trở của những người vận hành chuỗi trà sữa, PBVM ra đời nhằm xóa bỏ rào cản trong việc thiết kế ly in logo riêng và chuẩn bị nguyên liệu pha chế hàng ngày.
                <br /><br />
                Chúng tôi gom tất cả catalog bao bì ly cốc, màng dập, ống hút và nguyên liệu trà sữa cao cấp vào một nền tảng thống nhất, đồng bộ dữ liệu kho thực tế để bạn luôn an tâm vận hành chuỗi.
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <Button asChild className="bg-[#3BB77E] hover:bg-[#2f9565] text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-[0.98] border-0 cursor-pointer">
                  <Link href="/design-cup">Tự thiết kế ly 3D</Link>
                </Button>
                <Button asChild variant="outline" className="border-[#E2EDE8] hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 rounded-xl font-bold px-6 py-3 transition-all cursor-pointer">
                  <Link href="/products">Xem bảng giá sỉ</Link>
                </Button>
              </div>
            </div>

            {/* Right Asset Showcase */}
            <div className="relative aspect-[4/3] w-full rounded-[20px] overflow-hidden border border-[#E2EDE8] dark:border-zinc-800/80 bg-[#FAF8F6] dark:bg-zinc-900 shadow-md">
              <Image
                src="/images/about-showcase.png"
                alt="PBVM custom printed cups and ingredients B2B setup"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Stats Wall */}
      <section className="py-12 md:py-16 bg-[#DEF9EC]/40 dark:bg-[#1b3d2f]/10">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="space-y-2 text-center sm:text-left bg-white dark:bg-[#121d19] p-6 rounded-2xl border border-[#E2EDE8]/60 dark:border-zinc-800/60 shadow-sm">
                <div className="text-3xl md:text-4xl font-black text-[#3BB77E] tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm font-bold text-[#253D4E] dark:text-zinc-200">
                  {stat.label}
                </div>
                <p className="text-xs text-muted-foreground dark:text-zinc-400 leading-normal">
                  {stat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Vision & Mission (Vision & Mission) */}
      <section className="py-16 md:py-20 bg-white dark:bg-[#0b1310]">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="grid gap-8 md:grid-cols-2">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div key={idx} className="bg-[#FAF8F6] dark:bg-[#121d19] border border-[#E2EDE8] dark:border-zinc-800/60 rounded-[20px] p-8 flex gap-5 shadow-sm">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-[#DEF9EC] dark:bg-[#1b3d2f] text-[#3BB77E] shrink-0">
                    <Icon className="size-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-[#253D4E] dark:text-zinc-100">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-zinc-300 leading-relaxed">
                      {pillar.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 4: Features Grid (Why Choose Us) */}
      <section className="py-16 md:py-20 bg-[#FAF8F6] dark:bg-[#121d19]/20 border-t border-[#E2EDE8] dark:border-zinc-800/80">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="max-w-3xl mb-12 space-y-3">
            <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-[#3BB77E] font-bold">
              Ưu thế vượt trội
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#253D4E] dark:text-zinc-100 leading-none">
              Tại sao hàng trăm chuỗi quán đồng hành cùng PBVM?
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="group flex flex-col justify-between bg-white dark:bg-[#121d19] border border-[#E2EDE8] dark:border-zinc-800/80 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-[#BCE3C9]">
                  <div className="space-y-4">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-[#DEF9EC] dark:bg-[#1b3d2f] text-[#3BB77E]">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="text-sm font-extrabold text-[#253D4E] dark:text-zinc-100 group-hover:text-[#3BB77E] transition-colors leading-snug">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-muted-foreground dark:text-zinc-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 5: Call to Action (CTA) */}
      <section className="py-16 md:py-24 bg-white dark:bg-[#0b1310]">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl text-center">
          <div className="bg-[#121d19] text-white rounded-[32px] p-8 md:p-16 border border-[#233f32] relative overflow-hidden shadow-xl">
            {/* Background decoration elements */}
            <div className="absolute top-0 right-0 size-64 bg-[#3BB77E]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 size-64 bg-[#3BB77E]/5 rounded-full blur-3xl" />

            <div className="relative z-10 space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white">
                Sẵn sàng nâng tầm thương hiệu trà sữa của bạn?
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Tự phối logo lên ly 3D trực quan cực nhanh, xem báo giá sỉ ly nhựa và nguyên liệu pha chế theo thời gian thực và đặt hàng dễ dàng cùng hệ thống PBVM B2B.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Button asChild className="w-full sm:w-auto bg-[#3BB77E] hover:bg-[#2f9565] text-white font-bold px-8 py-3.5 rounded-xl transition-all border-0 cursor-pointer">
                  <Link href="/design-cup">Tự thiết kế ly 3D</Link>
                </Button>
                <Button asChild variant="outline" className="w-full sm:w-auto border-white/20 hover:bg-white/10 hover:text-white rounded-xl font-bold px-8 py-3.5 transition-all text-white bg-transparent cursor-pointer">
                  <Link href="/products">Khám phá</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
