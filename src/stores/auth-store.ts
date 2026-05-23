import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CustomerType } from "@/types/api";

type CustomerSession = {
  id: string;
  name: string;
  type: CustomerType;
  tenantId: string;
};

type AuthState = {
  user: CustomerSession | null;
  setUser: (user: CustomerSession | null) => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: "pbvm-shop-auth",
    },
  ),
);
