"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const msg = String(args[0] || "");
    if (
      msg.includes("Encountered a script tag") ||
      msg.includes("hydration-mismatch") ||
      msg.includes("fdprocessedid") ||
      msg.includes("Server rendered HTML didn't match") ||
      msg.includes("did not match the server") ||
      msg.includes("Expected static flag was missing")
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      disableTransitionOnChange
      enableSystem
      scriptProps={{ suppressHydrationWarning: true }}
    >
      {children}
    </NextThemesProvider>
  );
}
