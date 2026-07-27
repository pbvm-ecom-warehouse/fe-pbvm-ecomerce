"use client";

import * as React from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { FCMProvider } from "@/providers/fcm-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TooltipProvider>
          <FCMProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </FCMProvider>
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
