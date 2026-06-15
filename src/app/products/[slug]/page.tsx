import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Truck, FileText, Sparkles, Box, ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddToCartButton } from "@/features/catalog/components/add-to-cart-button";
import { getCatalogProductBySlug } from "@/features/catalog/services/catalog.service";
import { formatCurrency } from "@/utils/format-currency";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getCatalogProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const imageSrc = product.imageUrl || "/images/product-placeholder.svg";

  // Mock specifications based on product type
  const specs = [
    { label: "Quy cách đóng gói", value: product.category === "ingredient" ? "Bao 25kg hoặc Thùng 10 túi" : "Thùng 1000 cái (20 cây x 50 cái)" },
    { label: "Kích thước / Dung tích", value: product.name.includes("500ml") ? "500ml (Ø 95mm)" : product.name.includes("700ml") ? "700ml (Ø 95mm)" : product.category === "ingredient" ? "Khối lượng tịnh 1kg - 25kg" : "Tiêu chuẩn F&B" },
    { label: "Chất liệu chính", value: product.category === "plain_cup" || product.category === "printed_cup" ? "Nhựa PP/PET cao cấp nguyên sinh" : "Nguyên liệu pha chế chuyên nghiệp" },
    { label: "Số lượng tối thiểu (MOQ)", value: product.category === "printed_cup" ? "1,000 cái (1 thùng)" : "1 sản phẩm" },
    { label: "Hạn sử dụng / Độ bền", value: product.category === "ingredient" ? "12 tháng kể từ ngày sản xuất" : "Không giới hạn (Bảo quản mát)" },
  ];

  const showDesignCTA = product.category === "printed_cup" || product.category === "plain_cup";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 flex flex-col gap-6 bg-[#FAF8F6] dark:bg-[#1C1816] min-h-screen">
      {/* Back button */}
      <div>
        <Link href="/products" className="inline-flex items-center gap-1 text-xs font-bold text-[#7A6F68] hover:text-primary transition-colors">
          <ArrowLeft className="size-3.5" /> Quay lại danh mục sản phẩm
        </Link>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image & Tech Specs */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Image Wrapper */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#E6DFD9] bg-white flex items-center justify-center shadow-sm p-8">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-contain p-4 transition-transform duration-500 hover:scale-102"
              priority
            />
            {product.price > product.b2bPrice && (
              <Badge className="absolute top-4 left-4 bg-primary text-white font-bold text-xs uppercase px-2.5 py-1">
                Chiết khấu sỉ
              </Badge>
            )}
          </div>

          {/* wholesale volume brackets */}
          <Card className="border-[#E6DFD9] bg-white shadow-sm overflow-hidden">
            <CardHeader className="bg-[#FAF8F6] border-b border-[#E6DFD9]/60 py-4 px-6">
              <CardTitle className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider">
                Bảng Giá Chiết Khấu Sỉ B2B (Khuyên Dùng)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6DFD9] text-[#7A6F68] font-bold">
                      <th className="pb-2">Phân loại khách hàng</th>
                      <th className="pb-2">Số lượng đặt</th>
                      <th className="pb-2 text-right">Chiết khấu</th>
                      <th className="pb-2 text-right">Đơn giá ước tính</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD9]/40 text-[#1C1917] font-semibold">
                    <tr className="py-3">
                      <td className="py-3 font-medium">Mua lẻ trải nghiệm</td>
                      <td className="py-3">Dưới 10 {product.unit}</td>
                      <td className="py-3 text-right text-muted-foreground">0%</td>
                      <td className="py-3 text-right">{formatCurrency(product.price)}</td>
                    </tr>
                    <tr className="py-3 bg-[#FAF8F6]/50">
                      <td className="py-3 font-bold text-primary">Cửa hàng sỉ (B2B)</td>
                      <td className="py-3 font-bold">10 - 49 {product.unit}</td>
                      <td className="py-3 text-right text-primary font-bold">Giảm 5%</td>
                      <td className="py-3 text-right text-primary font-bold">{formatCurrency(product.b2bPrice)}</td>
                    </tr>
                    <tr className="py-3">
                      <td className="py-3 font-bold text-emerald-600">Đại lý / Chuỗi lớn</td>
                      <td className="py-3 font-bold">Từ 50 {product.unit} trở lên</td>
                      <td className="py-3 text-right text-emerald-600 font-bold">Giảm 15%</td>
                      <td className="py-3 text-right text-emerald-600 font-bold">{formatCurrency(product.b2bPrice * 0.9)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-[#7A6F68] mt-3 leading-relaxed">
                * Hệ thống tự động tính chiết khấu tối đa trong giỏ hàng dựa trên tổng số lượng sản phẩm.
              </p>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card className="border-[#E6DFD9] bg-white shadow-sm">
            <CardHeader className="bg-[#FAF8F6] border-b border-[#E6DFD9]/60 py-4 px-6">
              <CardTitle className="text-xs font-bold text-[#5C3D2E] uppercase tracking-wider">
                Thông số sản phẩm & Chi tiết
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-8 text-xs">
                {specs.map((spec, i) => (
                  <div key={i} className="border-b border-[#E6DFD9]/40 pb-2">
                    <dt className="text-[#7A6F68] font-medium">{spec.label}</dt>
                    <dd className="text-[#1C1917] font-bold mt-0.5">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pricing, Cart & Trust */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Main order Card */}
          <Card className="border-[#E6DFD9] bg-white shadow-sm p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-[#D2B48C] text-[#5C3D2E] text-[10px] font-bold uppercase tracking-wider">
                  SKU: {product.productRefId}
                </Badge>
                <Badge className="bg-primary/10 text-primary text-[10px] font-bold uppercase border-0">
                  {product.category === "ingredient" ? "Nguyên liệu" : "Đóng gói B2B"}
                </Badge>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1C1917] leading-tight">
                {product.name}
              </h1>

              <hr className="border-[#E6DFD9]/60" />

              {/* Pricing section */}
              <div>
                <div className="text-[10px] text-[#7A6F68] font-bold tracking-wider uppercase mb-1">
                  Giá Sỉ Doanh Nghiệp (B2B)
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-primary">
                    {formatCurrency(product.b2bPrice)}
                  </span>
                  <span className="text-xs font-bold text-[#7A6F68]">
                    / {product.unit}
                  </span>
                </div>
                {product.price > product.b2bPrice && (
                  <div className="text-xs text-[#7A6F68] mt-0.5 font-medium">
                    Giá bán lẻ B2C gốc: <span className="line-through">{formatCurrency(product.price)}</span>
                  </div>
                )}
              </div>

              {/* Stock snapshot */}
              <div className="rounded-xl border border-[#E6DFD9] bg-[#FAF8F6] p-4 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#7A6F68] font-medium">Tồn kho hiện hữu:</span>
                  <span className="font-bold text-[#1C1917]">
                    {product.stockSnapshot.toLocaleString("vi-VN")} {product.unit}
                  </span>
                </div>
                <div className="text-[10px] text-[#7A6F68] leading-relaxed font-medium">
                  * Đơn hàng sỉ số lượng lớn được điều phối xuất kho realtime từ 3 tổng kho thông minh của PBVM.
                </div>
              </div>

              {/* Add to Cart Actions */}
              <div className="pt-2">
                <AddToCartButton className="w-full bg-primary hover:bg-[#4A2E22] text-white py-6 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]" product={product} />
              </div>
            </div>
          </Card>

          {/* 3D Visualizer Cross-Link */}
          {showDesignCTA && (
            <Card className="border-[#D2B48C] bg-gradient-to-br from-[#FAF8F6] to-[#FAF6F0] shadow-sm relative overflow-hidden group">
              <div className="absolute right-0 bottom-0 h-full w-1/3 opacity-5 bg-[radial-gradient(circle_at_center,black_0%,transparent_70%)] pointer-events-none" />
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="size-4 text-[#D2B48C] animate-pulse" />
                  Mô phỏng in ấn thương hiệu 3D
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#5C3D2E]">
                    Tự thiết kế Logo của bạn lên cốc nhựa PP/PET
                  </h3>
                  <p className="text-xs text-[#7A6F68] mt-1.5 leading-relaxed">
                    Bạn muốn xem thử logo quán trà sữa của mình hiển thị như thế nào trên chiếc ly này? Hãy thử ngay công cụ mô phỏng 3D góc nhìn 360 độ của chúng tôi.
                  </p>
                </div>
                <Link href="/design">
                  <Button className="w-full bg-primary hover:bg-[#4A2E22] text-white font-bold text-xs py-5 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-[0.98]">
                    Mở xưởng thiết kế 3D ngay
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Delivery & Assurance badges */}
          <div className="flex flex-col gap-3">
            <div className="rounded-xl border border-[#E6DFD9] bg-white p-4 flex items-start gap-3 shadow-xs">
              <Truck className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#5C3D2E]">Giao chành xe toàn quốc</h4>
                <p className="text-[10px] text-[#7A6F68] mt-0.5 leading-relaxed">PBVM hỗ trợ đóng hàng carton xuất khẩu, giao xe tải hoặc chuyển chành xe khu vực tỉnh lẻ nhanh chóng, phí cước ưu đãi sỉ.</p>
              </div>
            </div>
            <div className="rounded-xl border border-[#E6DFD9] bg-white p-4 flex items-start gap-3 shadow-xs">
              <ShieldCheck className="size-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-[#5C3D2E]">Đồng bộ dữ liệu WMS/ERP</h4>
                <p className="text-[10px] text-[#7A6F68] mt-0.5 leading-relaxed">Đơn hàng được đồng bộ tự động vào hệ thống quản lý kho của xưởng, đảm bảo tiến độ sản xuất và chuẩn mực đóng gói.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
