"use client";

import Image from "next/image";
import Link from "next/link";
import { Award, ChevronDown, Clock, Cpu, Layers, Paintbrush, ShieldCheck, Sparkles, Target, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AboutPage() {
  const stats = [
    { value: "5Tr+", label: "Ly in đã xuất xưởng", description: "Bao gồm ly nhựa PP, PET, ly giấy và màng dập cốc" },
    { value: "500+", label: "Chuỗi cửa hàng đồng hành", description: "Cung cấp trọn gói cho các thương hiệu F&B Việt Nam" },
    { value: "99.8%", label: "Giao hàng đúng hẹn", description: "Quy trình vận hành logistics tối ưu qua chành xe & nội thành" },
    { value: "24/7", label: "Tự phục vụ thiết kế 3D", description: "Thiết kế logo trực quan, xoay 360 độ trực tuyến miễn phí" },
  ];

  const pillars = [
    {
      title: "Tầm nhìn chiến lược",
      text: "Trở thành người bạn đồng hành số 1 của các thương hiệu trà sữa và cà phê tại Việt Nam, số hóa chuỗi cung ứng bao bì và nguyên liệu để giúp các doanh nghiệp F&B tối ưu hóa vận hành từ khâu thiết kế đến giao nhận.",
      icon: Layers,
    },
    {
      title: "Sứ mệnh cốt lõi",
      text: "Đơn giản hóa quy trình mua sắm vật tư bằng cách tích hợp dịch vụ thiết kế ly nhựa in logo 3D trực quan và quản lý tồn kho theo thời gian thực (WMS), mang lại trải nghiệm minh bạch, nhanh chóng và chuẩn xác.",
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
      <section className="relative overflow-hidden pt-6 pb-12 md:pt-10 md:pb-20 lg:pt-12 lg:pb-24 border-b border-[#E2EDE8] dark:border-zinc-800/80">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DEF9EC] dark:bg-[#1b3d2f] text-[#3BB77E] text-xs font-bold uppercase tracking-wider">
                <Sparkles className="size-3.5" /> Về chúng tôi
              </div>

              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-[#253D4E] dark:text-zinc-100">
                Giải pháp bao bì & nguyên liệu <span className="text-[#3BB77E] italic">chuẩn hóa cho chuỗi F&B</span>
              </h1>

              <p className="text-base text-muted-foreground dark:text-zinc-300 leading-relaxed max-w-[58ch]">
                Được thành lập từ trăn trở của những người vận hành chuỗi trà sữa, PBVM ra đời nhằm xóa bỏ rào cản trong việc thiết kế ly in logo riêng và chuẩn bị nguyên liệu pha chế hàng ngày.
                <br /><br />
                Chúng tôi gom tất cả catalog bao bì ly cốc, màng dập, ống hút và nguyên liệu trà sữa cao cấp vào một nền tảng thống nhất, đồng bộ dữ liệu kho thực tế để bạn luôn an tâm vận hành chuỗi.
              </p>

              <div className="pt-4 flex flex-wrap gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="bg-[#3BB77E] hover:bg-[#2f9565] text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-[0.98] border-0 cursor-pointer inline-flex items-center justify-center text-center gap-1.5 h-11 select-none leading-none">
                      <span>Đặt ly</span>
                      <ChevronDown className="size-4 shrink-0 opacity-80" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48 bg-[#FAF8F6] border border-[#E9E3DD] rounded-xl shadow-md p-1.5 z-40">
                    <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                      <Link href="/products?category=plain_cup">Ly chưa thiết kế</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg text-xs font-bold text-slate-700 hover:bg-[#DEF9EC] hover:text-primary py-2.5 px-3 cursor-pointer">
                      <Link href="/design-cup">Ly tự thiết kế</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button asChild variant="outline" className="border-[#E2EDE8] hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 rounded-xl font-bold px-6 py-3 transition-all cursor-pointer h-11">
                  <Link href="/products">Xem bảng giá</Link>
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
                sizes="(min-width: 1024px) 50vw, 100vw"
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

    </main>
  );
}
