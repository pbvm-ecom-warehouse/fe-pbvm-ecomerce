import type { Metadata } from "next";

import { StoreHeader } from "@/components/layout/store-header";
import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "PBVM E-commerce",
  description: "Online ordering for milk tea ingredients and cups",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AppProviders>
          <StoreHeader />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
