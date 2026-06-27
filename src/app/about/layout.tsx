import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Về PBVM | Bao bì & Nguyên liệu B2B",
  description: "Tìm hiểu về PBVM - giải pháp cung cấp ly nhựa in thương hiệu và nguyên liệu trà sữa sỉ trọn gói, đồng bộ kho WMS cho chuỗi F&B.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
