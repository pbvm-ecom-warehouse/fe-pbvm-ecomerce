import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CustomerSession = {
  id: string;
  name: string;
  email?: string;
  type: "customer" | "admin";
  customerType?: "B2B" | "B2C";
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
