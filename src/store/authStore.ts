import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthState, UserRole, CustomerProfile, ProviderProfile } from "@/types";

const TOKEN_KEY = "snapfix_auth_token";

interface AuthActions {
  setRole:        (role: UserRole) => void;
  setUser:        (user: CustomerProfile | ProviderProfile) => void;
  setToken:       (token: string) => void;
  setLoading:     (loading: boolean) => void;
  logout:         () => Promise<void>;
  hydrateToken:   () => Promise<string | null>;
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

  setToken: (token) => {
    // Persist to device storage
    AsyncStorage.setItem(TOKEN_KEY, token).catch(console.error);
    set({ token });
  },

  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY).catch(console.error);
    set({ ...initialState });
  },

  /**
   * Call this once on app startup (e.g. in your root _layout.tsx).
   * Returns the token if one was persisted, null otherwise.
   */
  hydrateToken: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) set({ token });
      return token;
    } catch {
      return null;
    }
  },
}));