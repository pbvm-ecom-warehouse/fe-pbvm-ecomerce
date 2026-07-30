"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  BarChart3,
  Boxes,
  Calendar,
  CreditCard,
  PackageCheck,
  RefreshCw,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  UsersRound,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAnalyticsOverview,
  getMonthlyComparison,
  getRevenueTimeline,
  getTopSelling,
  type AnalyticsOverview,
  type DailyRevenueItem,
  type MonthlyComparison,
  type TopSellingItem,
} from "@/features/analytics/services/analytics.service";
import { formatCurrency } from "@/utils/format-currency";

type PeriodPreset = "day" | "week" | "month" | "year" | "custom";

const PERIOD_TABS: { id: PeriodPreset; label: string }[] = [
  { id: "day", label: "Hôm nay" },
  { id: "week", label: "Tuần này" },
  { id: "month", label: "Tháng này" },
  { id: "year", label: "Năm nay" },
  { id: "custom", label: "Tùy chọn" },
];

const orderStatusLabels: Record<string, string> = {
  PLACED: "Chờ duyệt",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const paymentStatusLabels: Record<string, string> = {
  UNPAID: "Chờ thanh toán",
  DEPOSIT_PAID: "Đã cọc",
  PROGRESS_PAID: "Đã thanh toán tiến độ",
  PAID: "Đã thanh toán",
  REFUND_PENDING: "Chờ hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
};

const fulfillmentStatusLabels: Record<string, string> = {
  NONE: "Chờ xuất kho",
  AWAITING_PRINT: "Chờ in",
  SAMPLE_PRINTED: "Chờ duyệt mẫu",
  READY_TO_PICK: "Chờ đóng gói",
  ISSUED: "Đã xuất kho",
  SHIPPED: "Đang vận chuyển",
  DELIVERED: "Đã giao hàng",
  RETURNED: "Đã trả hàng",
};

function getPeriodRange(preset: PeriodPreset): { from: string; to: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const today = fmt(now);

  if (preset === "day") return { from: today, to: today };

  if (preset === "week") {
    const day = now.getDay();
    const diffToMon = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    return { from: fmt(monday), to: today };
  }

  if (preset === "month") {
    return { from: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  }

  if (preset === "year") {
    return { from: fmt(new Date(now.getFullYear(), 0, 1)), to: today };
  }

  return { from: "", to: "" };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

function formatGrowth(value?: number) {
  const growth = Number(value ?? 0);
  const sign = growth > 0 ? "+" : "";
  return `${sign}${growth.toFixed(1)}%`;
}

function statusLabel(map: Record<string, string>, status: string) {
  return map[status] ?? status;
}

function MetricCard({
  icon,
  label,
  value,
  helper,
  tone = "emerald",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  helper: string;
  tone?: "emerald" | "blue" | "amber" | "rose";
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="border-b border-[#E9E3DD] bg-white p-5 sm:border-b-0 sm:border-r last:border-r-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-black text-slate-800">{value}</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">{helper}</p>
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ComparisonCard({
  title,
  value,
  previousValue,
  growth,
  money,
}: {
  title: string;
  value: number;
  previousValue: number;
  growth: number;
  money?: boolean;
}) {
  const positive = growth >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  const display = money ? formatCurrency(value) : formatNumber(value);
  const previous = money ? formatCurrency(previousValue) : formatNumber(previousValue);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">{title}</p>
          <p className="mt-2 text-lg font-black text-slate-800">{display}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-500">Kỳ trước: {previous}</p>
        </div>
        <Badge
          className={[
            "gap-1 rounded-full border-0 text-[10px] font-black",
            positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
          ].join(" ")}
        >
          <Icon className="size-3" />
          {formatGrowth(growth)}
        </Badge>
      </div>
    </div>
  );
}

export default function AdminFinancePage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [timeline, setTimeline] = useState<DailyRevenueItem[]>([]);
  const [topSelling, setTopSelling] = useState<TopSellingItem[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<MonthlyComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodPreset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { from: fromDate, to: toDate } =
    period === "custom" ? { from: customFrom, to: customTo } : getPeriodRange(period);

  const periodLabel = PERIOD_TABS.find((tab) => tab.id === period)?.label ?? "";

  const fetchData = async (from = fromDate, to = toDate) => {
    if (period === "custom" && (!from || !to)) return;

    setLoading(true);
    try {
      const [overviewData, timelineData, topSellingData, comparisonData] = await Promise.all([
        getAnalyticsOverview(),
        getRevenueTimeline(from || undefined, to || undefined),
        getTopSelling(10),
        getMonthlyComparison(),
      ]);

      setOverview(overviewData);
      setTimeline(timelineData || []);
      setTopSelling(topSellingData || []);
      setMonthlyComparison(comparisonData);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải dữ liệu phân tích từ Backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(fromDate, toDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, period]);

  const revenueInRange = useMemo(
    () => timeline.reduce((sum, item) => sum + Number(item.revenue || 0), 0),
    [timeline],
  );
  const ordersInRange = useMemo(
    () => timeline.reduce((sum, item) => sum + Number(item.orderCount || 0), 0),
    [timeline],
  );

  const paidOrders =
    overview?.ordersByPaymentStatus?.find((item) => item.status === "PAID")?.count ?? 0;
  const totalOrders = overview?.totalOrders ?? 0;
  const paidRate = totalOrders > 0 ? Math.round((paidOrders / totalOrders) * 100) : 0;
  const outOfStock = overview?.outOfStockVariants ?? 0;

  return (
    <div className="space-y-6 pb-10">
      <Card className="overflow-hidden rounded-2xl border border-[#E9E3DD] bg-white shadow-sm">
        <div className="border-b border-[#E9E3DD] px-6 py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Wallet className="size-5" />
              </div>
              <div>
                <h1 className="text-base font-black uppercase tracking-wider text-slate-800">
                  Phân tích doanh thu & vận hành
                </h1>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Dữ liệu lấy trực tiếp từ Ecommerce Analytics API.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-100 p-1">
                {PERIOD_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPeriod(tab.id)}
                    className={[
                      "h-8 rounded-lg px-3 text-xs font-bold transition-all",
                      period === tab.id
                        ? "border border-emerald-200 bg-white text-emerald-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {period === "custom" ? (
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <Calendar className="ml-2 size-3.5 text-slate-400" />
                  <Input
                    type="date"
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                    className="h-7 w-32 border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
                  />
                  <span className="text-xs text-slate-300">-</span>
                  <Input
                    type="date"
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                    className="h-7 w-32 border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
                  />
                </div>
              ) : null}

              <Button
                onClick={() => fetchData(fromDate, toDate)}
                variant="outline"
                size="sm"
                disabled={loading}
                className="h-9 rounded-xl border-slate-200 text-xs font-bold"
              >
                <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<CreditCard className="size-5" />}
            label="Tổng doanh thu"
            value={formatCurrency(overview?.totalRevenue ?? 0)}
            helper={`${paidOrders}/${totalOrders} đơn đã thanh toán`}
          />
          <MetricCard
            icon={<ShoppingBag className="size-5" />}
            label="Tổng đơn hàng"
            value={formatNumber(totalOrders)}
            helper={`${paidRate}% đơn đã ghi nhận thanh toán đủ`}
            tone="blue"
          />
          <MetricCard
            icon={<UsersRound className="size-5" />}
            label="Khách hàng"
            value={formatNumber(overview?.totalCustomers ?? 0)}
            helper="Tổng khách hàng hoạt động"
            tone="amber"
          />
          <MetricCard
            icon={<Boxes className="size-5" />}
            label="Biến thể sản phẩm"
            value={formatNumber(overview?.totalVariants ?? 0)}
            helper={`${outOfStock} biến thể hết hàng`}
            tone={outOfStock > 0 ? "rose" : "emerald"}
          />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(360px,0.9fr)]">
        <Card className="rounded-2xl border border-[#E9E3DD] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-slate-800">
                <BarChart3 className="size-4 text-emerald-600" />
                Doanh thu theo ngày
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {periodLabel}: {fromDate || "--"} đến {toDate || "--"} · Tổng {formatCurrency(revenueInRange)} · {ordersInRange} đơn
              </p>
            </div>
            <Badge variant="outline" className="w-fit border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700">
              Live API
            </Badge>
          </div>

          <div className="mt-5 h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9E3DD" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${Math.round(Number(value) / 1000000)}M`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === "revenue" ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                    name === "revenue" ? "Doanh thu" : "Số đơn",
                  ]}
                  labelFormatter={(label) => `Ngày ${label}`}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #E9E3DD",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fill="url(#adminRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="rounded-2xl border border-[#E9E3DD] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            So sánh tháng này
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            API `/admin/analytics/monthly-comparison`.
          </p>

          <div className="mt-4 grid gap-3">
            <ComparisonCard
              title="Doanh thu"
              value={monthlyComparison?.revenue.currentValue ?? 0}
              previousValue={monthlyComparison?.revenue.previousValue ?? 0}
              growth={monthlyComparison?.revenue.growthPercentage ?? 0}
              money
            />
            <ComparisonCard
              title="Đơn hàng"
              value={monthlyComparison?.orders.currentValue ?? 0}
              previousValue={monthlyComparison?.orders.previousValue ?? 0}
              growth={monthlyComparison?.orders.growthPercentage ?? 0}
            />
            <ComparisonCard
              title="Khách hàng mới"
              value={monthlyComparison?.customers.currentValue ?? 0}
              previousValue={monthlyComparison?.customers.previousValue ?? 0}
              growth={monthlyComparison?.customers.growthPercentage ?? 0}
            />
            <ComparisonCard
              title="AOV"
              value={monthlyComparison?.aov.currentValue ?? 0}
              previousValue={monthlyComparison?.aov.previousValue ?? 0}
              growth={monthlyComparison?.aov.growthPercentage ?? 0}
              money
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="rounded-2xl border border-[#E9E3DD] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            Top sản phẩm bán chạy
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Dữ liệu từ `GET /admin/analytics/top-selling?limit=10`.
          </p>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-500">SKU</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500">Sản phẩm</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500">Đã bán</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500">Doanh thu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSelling.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-xs font-semibold text-slate-400">
                      Chưa có dữ liệu bán chạy.
                    </TableCell>
                  </TableRow>
                ) : (
                  topSelling.map((item) => (
                    <TableRow key={item.sku}>
                      <TableCell className="font-mono text-xs font-bold text-emerald-700">{item.sku}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-700">{item.name}</TableCell>
                      <TableCell className="text-right text-xs font-bold text-slate-600">
                        {formatNumber(item.totalQuantitySold)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-black text-slate-800">
                        {formatCurrency(item.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="rounded-2xl border border-[#E9E3DD] bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            Phân tích trạng thái
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Tổng hợp theo trạng thái đơn, thanh toán và kho xử lý.
          </p>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <StatusList
              title="Đơn hàng"
              items={overview?.ordersByOrderStatus ?? []}
              labels={orderStatusLabels}
            />
            <StatusList
              title="Thanh toán"
              items={overview?.ordersByPaymentStatus ?? []}
              labels={paymentStatusLabels}
            />
            <StatusList
              title="Kho xử lý"
              items={overview?.ordersByFulfillmentStatus ?? []}
              labels={fulfillmentStatusLabels}
            />
          </div>
        </Card>
      </div>

      {outOfStock > 0 ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <span>Có {outOfStock} biến thể đang hết hàng. Admin nên kiểm tra lại catalog và tồn kho WMS.</span>
        </div>
      ) : null}
    </div>
  );
}

function StatusList({
  title,
  items,
  labels,
}: {
  title: string;
  items: { status: string; count: number }[];
  labels: Record<string, string>;
}) {
  const total = items.reduce((sum, item) => sum + Number(item.count || 0), 0);

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-slate-500">{title}</p>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-xs font-semibold text-slate-400">Chưa có dữ liệu.</p>
        ) : (
          items.map((item) => {
            const percent = total > 0 ? Math.round((Number(item.count || 0) / total) * 100) : 0;
            return (
              <div key={item.status} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-bold text-slate-700">{statusLabel(labels, item.status)}</span>
                  <span className="font-mono font-black text-slate-800">{item.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
