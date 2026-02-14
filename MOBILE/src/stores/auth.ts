import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { UserContext } from "@/types/models";

interface AuthState {
  session: Session | null;
  user: UserContext | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: UserContext | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setSession: (session) =>
    set({
      session,
      isAuthenticated: !!session,
    }),

  setUser: (user) => set({ user }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: () =>
    set({
      session: null,
      user: null,
      isAuthenticated: false,
    }),
}));
