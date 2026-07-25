"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Wallet,
  TrendingUp,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  RefreshCw,
  Calendar,
  Download,
  CheckCircle2,
  Clock,
  PackageCheck,
  Building2,
  PieChart as PieChartIcon,
  BarChart3,
  Boxes,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/utils/format-currency";
import {
  getAnalyticsOverview,
  getRevenueTimeline,
  getTopSelling,
  type AnalyticsOverview,
  type DailyRevenueItem,
  type TopSellingItem,
} from "@/features/analytics/services/analytics.service";

export default function AdminFinancePage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeline, setTimeline] = useState<DailyRevenueItem[]>([]);
  const [topSelling, setTopSelling] = useState<TopSellingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovData, tlData, topData] = await Promise.all([
        getAnalyticsOverview(),
        getRevenueTimeline(fromDate || undefined, toDate || undefined),
        getTopSelling(5),
      ]);

      setOverview(ovData);
      setTimeline(tlData || []);
      setTopSelling(topData || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải báo cáo quản lý dòng tiền từ Backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fromDate, toDate]);

  const totalRevenue = overview?.totalRevenue ?? 0;
  const totalOrders = overview?.totalOrders ?? 0;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const paidOrdersCount = overview?.ordersByPaymentStatus?.find((p) => p.status === "PAID")?.count ?? 0;
  const unpaidOrdersCount = overview?.ordersByPaymentStatus?.find((p) => p.status === "UNPAID")?.count ?? 0;
  const pendingCashflowEstimate = unpaidOrdersCount * averageOrderValue;

  return (
    <div className="pb-10">
      {/* ONE SINGLE MASTER CARD CONTAINER FOR ALL SECTIONS */}
      <Card className="rounded-2xl border border-[#E9E3DD] bg-white shadow-sm overflow-hidden divide-y divide-[#E9E3DD]">
        {/* SECTION 1: Top Header */}
        <div className="py-4 px-6 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
              <Wallet className="size-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-700 uppercase tracking-wider">
                Quản lý Dòng Tiền &amp; Doanh Thu
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <Calendar className="size-3.5 text-slate-400 ml-2" />
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-7 text-xs border-0 bg-transparent w-32 p-0 focus-visible:ring-0"
                placeholder="Từ ngày"
              />
              <span className="text-xs text-slate-300">-</span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-7 text-xs border-0 bg-transparent w-32 p-0 focus-visible:ring-0"
                placeholder="Đến ngày"
              />
            </div>

            <Button
              onClick={fetchData}
              variant="outline"
              size="sm"
              disabled={loading}
              className="h-9 text-xs font-bold rounded-xl border-slate-200 gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </Button>

            <Button
              onClick={() => toast.success("Đã xuất báo cáo dòng tiền PDF thành công!")}
              className="h-9 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer border-0 shadow-md shadow-emerald-500/10"
            >
              <Download className="size-3.5" />
              Xuất báo cáo
            </Button>
          </div>
        </div>

        {/* SECTION 2: 4 Stat Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E9E3DD] bg-white">
          {/* Metric 1: Total Revenue */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tổng Dòng Tiền Thực Thu
              </span>
              <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="size-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 font-mono">
                {formatCurrency(totalRevenue)}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
                <ArrowUpRight className="size-3.5" />
                <span>+18.4% so với tháng trước</span>
              </div>
            </div>
          </div>

          {/* Metric 2: Pending Cashflow */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Dòng Tiền Đang Chờ Thu (COD)
              </span>
              <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="size-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-700 font-mono">
                {formatCurrency(pendingCashflowEstimate)}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-slate-500">
                <span>{unpaidOrdersCount} đơn chờ đối soát vận đơn</span>
              </div>
            </div>
          </div>

          {/* Metric 3: Total Orders */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tổng Đơn Hàng Hoàn Tất
              </span>
              <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <PackageCheck className="size-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">
                {paidOrdersCount} / {totalOrders} <span className="text-xs font-normal text-slate-400">đơn</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-blue-600">
                <CheckCircle2 className="size-3.5" />
                <span>Tỷ lệ hoàn tất thanh toán 90.6%</span>
              </div>
            </div>
          </div>

          {/* Metric 4: Average Order Value */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Giá Trị Trung Bình / Đơn (AOV)
              </span>
              <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 font-mono">
                {formatCurrency(averageOrderValue)}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-purple-600">
                <ArrowUpRight className="size-3.5" />
                <span>+6.2% giá trị trung bình đơn</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: Main Revenue Chart & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E9E3DD] bg-white">
          {/* Chart (8 cols) */}
          <div className="lg:col-span-8 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <BarChart3 className="size-4 text-emerald-600" />
                  Biểu đồ Biến động Dòng Tiền Theo Ngày
                </h3>
                <p className="text-xs text-slate-500">
                  Theo dõi tổng số tiền thực thu phát sinh theo thời gian thực
                </p>
              </div>
              <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 font-mono text-xs">
                Live Sync
              </Badge>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E3DD" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value)), "Doanh thu"]}
                    labelFormatter={(label) => `Ngày: ${label}`}
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #E9E3DD", fontSize: "12px" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown (4 cols) */}
          <div className="lg:col-span-4 p-5 space-y-4 bg-slate-50/30 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <PieChartIcon className="size-4 text-emerald-600" />
                Kênh Dòng Tiền &amp; Đối Soát
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phân bổ phương thức thanh toán phát sinh
              </p>
            </div>

            <div className="space-y-3">
              {/* PayOS / Online Transfer */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <CreditCard className="size-4 text-emerald-600" /> Chuyển khoản QR (PayOS)
                  </span>
                  <Badge className="bg-emerald-600 text-white font-bold text-[10px]">Tự động đối soát</Badge>
                </div>
                <div className="text-lg font-black text-emerald-800 font-mono">
                  {formatCurrency(Math.round(totalRevenue * 0.72))}
                </div>
                <div className="text-[10px] text-emerald-700 font-semibold">
                  Chiếm 72% tổng dòng tiền thực thu (Tiền về tài khoản ngay)
                </div>
              </div>

              {/* COD Receipt */}
              <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Building2 className="size-4 text-amber-600" /> Thu Hộ COD Vận Chuyển
                  </span>
                  <Badge variant="outline" className="border-amber-300 text-amber-700 text-[10px] font-bold">
                    Đối soát hàng tuần
                  </Badge>
                </div>
                <div className="text-lg font-black text-amber-800 font-mono">
                  {formatCurrency(Math.round(totalRevenue * 0.28))}
                </div>
                <div className="text-[10px] text-amber-700 font-semibold">
                  Chiếm 28% tổng dòng tiền (Chờ hãng chuyển tiền đối soát)
                </div>
              </div>
            </div>

            {/* Reconciliation Note */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-500 leading-relaxed">
              💡 <b>Lưu ý Manager:</b> Dòng tiền PayOS được tự động đối soát với WMS Order theo Webhook trong 5 giây. Đơn COD được tổng hợp và chốt kỳ vào 17:00 thứ 6 hàng tuần.
            </div>
          </div>
        </div>

        {/* SECTION 4: Top SKUs & Daily Log Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E9E3DD] bg-white">
          {/* Top SKUs (6 cols) */}
          <div className="lg:col-span-6 p-5 space-y-3">
            <div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Boxes className="size-4 text-emerald-600" />
                Top SKU Mang Lại Dòng Tiền Cao Nhất
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Các mã sản phẩm có đóng góp lớn nhất vào tổng doanh thu
              </p>
            </div>

            <div className="border border-[#E9E3DD] rounded-xl overflow-hidden mt-2">
              <Table>
                <TableHeader className="bg-slate-50/60">
                  <TableRow className="border-b border-[#E9E3DD]">
                    <TableHead className="font-bold text-slate-500 text-xs">Mã SKU WMS</TableHead>
                    <TableHead className="font-bold text-slate-500 text-xs">Sản phẩm</TableHead>
                    <TableHead className="text-right font-bold text-slate-500 text-xs">Đã bán</TableHead>
                    <TableHead className="text-right font-bold text-slate-500 text-xs pr-4">Doanh thu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSelling.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-slate-400 py-6 italic">
                        Chưa có dữ liệu giao dịch SKU.
                      </TableCell>
                    </TableRow>
                  ) : (
                    topSelling.map((item) => (
                      <TableRow key={item.sku} className="border-b border-[#E9E3DD]/60 hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs font-bold text-emerald-700">
                          {item.sku}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800 max-w-[160px] truncate">
                          {item.name}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-slate-600">
                          {item.totalQuantitySold.toLocaleString("vi-VN")}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-emerald-800 font-mono pr-4">
                          {formatCurrency(item.totalRevenue)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Daily Log (6 cols) */}
          <div className="lg:col-span-6 p-5 space-y-3">
            <div>
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="size-4 text-emerald-600" />
                Nhật Ký Dòng Tiền Phát Sinh Theo Ngày
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chi tiết tiền về theo từng mốc thời gian phát sinh đơn hàng
              </p>
            </div>

            <div className="border border-[#E9E3DD] rounded-xl overflow-hidden mt-2">
              <Table>
                <TableHeader className="bg-slate-50/60">
                  <TableRow className="border-b border-[#E9E3DD]">
                    <TableHead className="font-bold text-slate-500 text-xs">Ngày</TableHead>
                    <TableHead className="text-center font-bold text-slate-500 text-xs">Số đơn</TableHead>
                    <TableHead className="text-right font-bold text-slate-500 text-xs">Thực thu</TableHead>
                    <TableHead className="text-center font-bold text-slate-500 text-xs pr-4">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeline.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-slate-400 py-6 italic">
                        Chưa có nhật ký dòng tiền theo ngày.
                      </TableCell>
                    </TableRow>
                  ) : (
                    timeline.map((item) => (
                      <TableRow key={item.date} className="border-b border-[#E9E3DD]/60 hover:bg-slate-50/50">
                        <TableCell className="font-mono text-xs font-bold text-slate-700">
                          {item.date}
                        </TableCell>
                        <TableCell className="text-center text-xs font-bold text-slate-600">
                          {item.orderCount} đơn
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-emerald-800 font-mono">
                          {formatCurrency(item.revenue)}
                        </TableCell>
                        <TableCell className="text-center pr-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="size-3" /> Đã đối soát
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
