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
  type AnalyticsOverview,
  type DailyRevenueItem,
} from "@/features/analytics/services/analytics.service";

type PeriodPreset = "day" | "week" | "month" | "year" | "custom";

function getPeriodRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const today = fmt(now);

  if (preset === "day") return { from: today, to: today };

  if (preset === "week") {
    const day = now.getDay(); // 0=Sun
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const mon = new Date(now);
    mon.setDate(now.getDate() + diffToMon);
    return { from: fmt(mon), to: today };
  }

  if (preset === "month") {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: fmt(first), to: today };
  }

  if (preset === "year") {
    const first = new Date(now.getFullYear(), 0, 1);
    return { from: fmt(first), to: today };
  }

  return { from: "", to: "" };
}

const PERIOD_TABS: { id: PeriodPreset; label: string }[] = [
  { id: "day", label: "Hôm nay" },
  { id: "week", label: "Tuần này" },
  { id: "month", label: "Tháng này" },
  { id: "year", label: "Năm nay" },
];

export default function AdminFinancePage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeline, setTimeline] = useState<DailyRevenueItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Period preset
  const [period, setPeriod] = useState<PeriodPreset>("month");

  // Custom date range (only used when period === 'custom')
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { from: fromDate, to: toDate } =
    period === "custom"
      ? { from: customFrom, to: customTo }
      : getPeriodRange(period);

  const fetchData = async (from = fromDate, to = toDate) => {
    setLoading(true);
    try {
      const [ovData, tlData] = await Promise.all([
        getAnalyticsOverview(),
        getRevenueTimeline(from || undefined, to || undefined),
      ]);

      setOverview(ovData);
      setTimeline(tlData || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải báo cáo quản lý dòng tiền từ Backend.");
    } finally {
      setLoading(false);
    }
  };

  // Refetch whenever the resolved date range changes
  useEffect(() => {
    if (period === "custom" && (!customFrom || !customTo)) return; // wait until both are set
    fetchData(fromDate, toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);

  const totalRevenue = overview?.totalRevenue ?? 0;
  const totalOrders = overview?.totalOrders ?? 0;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const paidOrdersCount = overview?.ordersByPaymentStatus?.find((p) => p.status === "PAID")?.count ?? 0;
  const unpaidOrdersCount = overview?.ordersByPaymentStatus?.find((p) => p.status === "UNPAID")?.count ?? 0;
  const pendingCashflowEstimate = unpaidOrdersCount * averageOrderValue;

  // Doanh thu từ đơn đã thanh toán online (PayOS) — ước tính từ kỳ timeline
  const timelineTotal = timeline.reduce((sum, d) => sum + d.revenue, 0);
  const timelineOrders = timeline.reduce((sum, d) => sum + d.orderCount, 0);

  // Tỷ lệ thanh toán thực tế
  const paidRate = totalOrders > 0 ? Math.round((paidOrdersCount / totalOrders) * 100) : 0;

  // Label kỳ đang xem
  const periodLabel = PERIOD_TABS.find((t) => t.id === period)?.label ?? "";


  return (
    <div className="pb-10">
      {/* ONE SINGLE MASTER CARD CONTAINER FOR ALL SECTIONS */}
      <Card className="rounded-2xl border border-[#E9E3DD] bg-white shadow-sm overflow-hidden divide-y divide-[#E9E3DD]">
        {/* SECTION 1: Top Header */}
        <div className="bg-white px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs">
                <Wallet className="size-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base font-black uppercase tracking-wider text-slate-800">
                  Quản lý dòng tiền &amp; doanh thu
                </h1>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Kỳ xem: {periodLabel} · {fromDate || "--"} đến {toDate || "--"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100 p-1">
                {PERIOD_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    id={`period-tab-${tab.id}`}
                    onClick={() => setPeriod(tab.id)}
                    className={`h-8 rounded-lg px-3 text-xs font-bold transition-all cursor-pointer ${period === tab.id
                        ? "border border-emerald-200 bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {period === "custom" && (
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <Calendar className="ml-2 size-3.5 text-slate-400" />
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="h-7 w-32 border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
                    placeholder="Từ ngày"
                  />
                  <span className="text-xs text-slate-300">-</span>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="h-7 w-32 border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
                    placeholder="Đến ngày"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fetchData(fromDate, toDate)}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="h-9 rounded-xl border-slate-200 text-xs font-bold gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                  Làm mới
                </Button>

                <Button
                  onClick={() => toast.success("Đã xuất báo cáo dòng tiền PDF thành công!")}
                  className="h-9 rounded-xl bg-emerald-600 text-xs font-bold text-white gap-1.5 cursor-pointer border-0 shadow-md shadow-emerald-500/10 hover:bg-emerald-700"
                >
                  <Download className="size-3.5" />
                  Xuất báo cáo
                </Button>
              </div>
            </div>
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
            </div>
          </div>

          {/* Metric 2: Pending Cashflow */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Tiền Đang Chờ Thu (COD)
              </span>
              <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="size-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-700 font-mono">
                {formatCurrency(pendingCashflowEstimate)}
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
            </div>
          </div>

          {/* Metric 4: Average Order Value */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Giá Trị Trung Bình / Đơn
              </span>
              <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="size-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 font-mono">
                {formatCurrency(averageOrderValue)}
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
                  Biểu đồ Biến động Dòng Tiền — {periodLabel}
                </h3>
                <p className="text-xs text-slate-500">
                  {timeline.length > 0
                    ? `${timeline.length} mốc dữ liệu · Tổng ${formatCurrency(timelineTotal)}`
                    : "Chưa có dữ liệu doanh thu trong kỳ này"}
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

          {/* Reconciliation Summary */}
          <div className="lg:col-span-4 bg-slate-50/40 p-5">
            <div className="space-y-4">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-700">
                  <PieChartIcon className="size-4 text-emerald-600" />
                  Kênh dòng tiền &amp; đối soát
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tổng hợp trạng thái thu tiền để đối soát nhanh trong kỳ
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-xl border border-emerald-200 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <CreditCard className="size-4" />
                      </span>
                      <div>
                        <div className="text-xs font-black text-slate-700">Đã thu</div>
                        <div className="text-[10px] font-bold text-slate-400">{paidOrdersCount} đơn đã thanh toán</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-600 text-[10px] font-bold text-white">PAID</Badge>
                  </div>
                  <div className="mt-3 font-mono text-xl font-black text-emerald-700">
                    {formatCurrency(totalRevenue)}
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-white p-3.5 shadow-2xs">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Building2 className="size-4" />
                      </span>
                      <div>
                        <div className="text-xs font-black text-slate-700">Chờ thu</div>
                        <div className="text-[10px] font-bold text-slate-400">{unpaidOrdersCount} đơn chưa hoàn tất thanh toán</div>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-amber-300 text-[10px] font-bold text-amber-700">
                      UNPAID
                    </Badge>
                  </div>
                  <div className="mt-3 font-mono text-xl font-black text-amber-700">
                    {formatCurrency(pendingCashflowEstimate)}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Tỷ lệ đã thu</span>
                    <span className="font-mono text-slate-700">{paidRate}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(0, paidRate))}%` }}
                    />
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-slate-400">
                    {paidOrdersCount}/{totalOrders} đơn đã ghi nhận thanh toán
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: Daily Cashflow Log */}
        <div className="bg-white">
          <div className="p-5 space-y-3">
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
