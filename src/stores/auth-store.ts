import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { CustomerType } from "@/types/api";

type CustomerSession = {
  id: string;
  name: string;
  email?: string;
  type: CustomerType;
  tenantId: string;
  phone?: string;
  avatar?: string;
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
