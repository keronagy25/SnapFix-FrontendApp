import { create } from "zustand";
import type {
  AuthState,
  UserRole,
  CustomerProfile,
  ProviderProfile,
} from "@/types";

interface AuthActions {
  setRole:   (role: UserRole) => void;
  setUser:   (user: CustomerProfile | ProviderProfile) => void;
  setToken:  (token: string) => void;
  logout:    () => void;
  setLoading:(loading: boolean) => void;
}

const initialState: AuthState = {
  user:            null,
  role:            null,
  isAuthenticated: false,
  isLoading:       false,
  token:           null,
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  ...initialState,

  setRole: (role) => set({ role }),

  setUser: (user) =>
    set({
      user,
      role:            user.role,
      isAuthenticated: true,
    }),

  setToken: (token) => set({ token }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () => set({ ...initialState }),
}));