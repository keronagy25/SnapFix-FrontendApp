import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthState, UserRole, CustomerProfile, ProviderProfile } from "@/types";

const TOKEN_KEY = "snapfix_auth_token";
const ONBOARDING_TOKEN_KEY = "snapfix_onboarding_token";
const ROLE_KEY = "snapfix_auth_role";
const BASE_URL = "https://snap-fix-api-production.up.railway.app/api/v1";

interface AuthActions {
  setRole: (role: UserRole) => void;
  setUser: (user: CustomerProfile | ProviderProfile | null) => void;
  setToken: (token: string | null) => void;
  setOnboardingToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
  hydrateToken: () => Promise<string | null>;
  fetchMe: () => Promise<void>;
  hydrateAndFetch: () => Promise<void>;
}

const initialState: AuthState = {
  user: null,
  role: null,
  isAuthenticated: false,
  isLoading: false,
  token: null,
  onboardingToken: null,
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  ...initialState,

  setRole: (role) => {
    AsyncStorage.setItem(ROLE_KEY, role ?? "").catch(console.error);
    set({ role });
  },

  setUser: (user) =>
    set(
      user
        ? { user, role: user.role, isAuthenticated: true }
        : { user: null, isAuthenticated: false }
    ),

  setToken: (token) => {
    if (token) {
      AsyncStorage.setItem(TOKEN_KEY, token).catch(console.error);
    } else {
      AsyncStorage.removeItem(TOKEN_KEY).catch(console.error);
    }
    set({ token });
  },

  setOnboardingToken: (token) => {
    if (token) {
      AsyncStorage.setItem(ONBOARDING_TOKEN_KEY, token).catch(console.error);
    } else {
      AsyncStorage.removeItem(ONBOARDING_TOKEN_KEY).catch(console.error);
    }
    set({ onboardingToken: token });
  },

  setLoading: (isLoading) => set({ isLoading }),

  fetchMe: async () => {
    const { token, role } = get();
    if (!token) return;

    const endpoint =
      role === "provider" ? "/providers/me/" : "/customers/me/";

    set({ isLoading: true });
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY, ONBOARDING_TOKEN_KEY]).catch(console.error);
          set({ ...initialState });
        }
        return;
      }

      const data: CustomerProfile | ProviderProfile = await res.json();
      set({
        user: data,
        role: (data as any).role ?? role,
        isAuthenticated: true,
      });
    } catch (err) {
      console.error("[fetchMe]", err);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const { token, role } = get();

    const endpoint =
      role === "provider" ? "/providers/logout/" : "/customers/logout/";

    if (token) {
      try {
        await fetch(`${BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
          },
        });
      } catch (err) {
        console.error("[logout]", err);
      }
    }

    await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY, ONBOARDING_TOKEN_KEY]).catch(console.error);
    set({ ...initialState });
  },

  hydrateToken: async () => {
    try {
      const [[, token], [, role], [, onboardingToken]] = await AsyncStorage.multiGet([
        TOKEN_KEY,
        ROLE_KEY,
        ONBOARDING_TOKEN_KEY,
      ]);
      if (token) set({ token });
      if (role) set({ role: role as UserRole });
      if (onboardingToken) set({ onboardingToken });
      return token;
    } catch {
      return null;
    }
  },

  hydrateAndFetch: async () => {
    const token = await get().hydrateToken();
    if (token) await get().fetchMe();
  },
}));