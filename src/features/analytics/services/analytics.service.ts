import { apiClient } from "@/lib/api-client";
import { type ApiEnvelope, unwrapApiData } from "@/lib/api-contract";

export type AnalyticsOverview = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalVariants: number;
  outOfStockVariants: number;
  ordersByOrderStatus: { status: string; count: number }[];
  ordersByPaymentStatus: { status: string; count: number }[];
  ordersByFulfillmentStatus: { status: string; count: number }[];
};

export type TopSellingItem = {
  sku: string;
  name: string;
  totalQuantitySold: number;
  totalRevenue: number;
};

export type DailyRevenueItem = {
  date: string;
  revenue: number;
  orderCount: number;
};

export async function getAnalyticsOverview(): Promise<AnalyticsOverview> {
  const response = await apiClient.get<
    ApiEnvelope<AnalyticsOverview> | AnalyticsOverview
  >("/admin/analytics/overview");
  return unwrapApiData(response.data);
}

export async function getTopSelling(limit = 10): Promise<TopSellingItem[]> {
  const response = await apiClient.get<
    ApiEnvelope<TopSellingItem[]> | TopSellingItem[]
  >("/admin/analytics/top-selling", {
    params: { limit },
  });
  return unwrapApiData(response.data);
}

export async function getRevenueTimeline(
  fromDate?: string,
  toDate?: string,
): Promise<DailyRevenueItem[]> {
  const response = await apiClient.get<
    ApiEnvelope<DailyRevenueItem[]> | DailyRevenueItem[]
  >("/admin/analytics/revenue", {
    params: { fromDate, toDate },
  });
  return unwrapApiData(response.data);
}
