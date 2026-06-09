import type { Metadata } from "next";

import { StoreHeader } from "@/components/layout/store-header";
import { StoreFooter } from "@/components/layout/store-footer";
import { AppProviders } from "@/providers/app-providers";
import { ScrollToTop } from "@/components/layout/scroll-to-top";

import "./globals.css";

export const metadata: Metadata = {
  title: "PBVM E-commerce - Nguyên Liệu & In Ly Trà Sữa",
  description: "Hệ thống đặt hàng nguyên liệu trà sữa, bột kem béo, trân châu và dịch vụ in ly nhựa, ly giấy chất lượng cao cho các thương hiệu F&B.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased flex flex-col justify-between">
        <AppProviders>
          <ScrollToTop />
          <div>
            <StoreHeader />
            {children}
          </div>
          <StoreFooter />
        </AppProviders>
      </body>
    </html>
  );
}
