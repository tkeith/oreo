import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearToken: () => set({ token: null }),
    }),
    {
      name: "oreo-auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

// Computed value as a custom hook (following Zustand docs)
export const useIsAuthenticated = () => {
  return useAuthStore((state) => !!state.token);
};
