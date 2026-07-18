import type { Metadata } from "next";
import { Quicksand } from "next/font/google";

import { ScrollToTop } from "@/components/layout/scroll-to-top";
import { StoreFooter } from "@/components/layout/store-footer";
import { StoreHeader } from "@/components/layout/store-header";
import { StorefrontAdminRedirectGuard } from "@/components/layout/storefront-admin-redirect-guard";
import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

const quicksand = Quicksand({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

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
    <html lang="vi" suppressHydrationWarning className={quicksand.variable}>
      <body className={`${quicksand.className} min-h-screen bg-background text-foreground antialiased flex flex-col justify-between`}>
        <AppProviders>
          <ScrollToTop />
          <StorefrontAdminRedirectGuard>
            <div className="flex min-h-screen flex-col">
              <StoreHeader />
              <div className="flex-1">{children}</div>
              <StoreFooter />
            </div>
          </StorefrontAdminRedirectGuard>
        </AppProviders>
      </body>
    </html>
  );
}

