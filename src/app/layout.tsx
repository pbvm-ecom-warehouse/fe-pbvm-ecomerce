import type { Metadata } from "next";

import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { StoreFooter } from "@/components/layout/store-footer";
import { StoreHeader } from "@/components/layout/store-header";
import { StoreFooter } from "@/components/layout/store-footer";
import { AppProviders } from "@/providers/app-providers";
import { ScrollToTop } from "@/components/layout/scroll-to-top";

import "./globals.css";

export const metadata: Metadata = {
  title: "PBVM Shop | Bao bì và nguyên liệu B2B",
  description:
    "Đặt nguyên liệu trà sữa, ly nhựa và ly in custom với catalog đồng bộ WMS.",
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
          <div className="flex min-h-screen flex-col">
            <StoreHeader />
            <div className="flex-1">{children}</div>
            <StoreFooter />
          </div>
        </AppProviders>
      </body>
    </html>
  );
}
