import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthState, UserRole, CustomerProfile, ProviderProfile } from "@/types";

const TOKEN_KEY = "snapfix_auth_token";
const ROLE_KEY  = "snapfix_auth_role";
const BASE_URL  = "https://snap-fix-api-production.up.railway.app/api/v1";

interface AuthActions {
  setRole:         (role: UserRole) => void;
  setUser:         (user: CustomerProfile | ProviderProfile | null) => void;
  setToken:        (token: string | null) => void;
  setLoading:      (loading: boolean) => void;
  logout:          () => Promise<void>;
  hydrateToken:    () => Promise<string | null>;
  fetchMe:         () => Promise<void>;
  hydrateAndFetch: () => Promise<void>;
}

const initialState: AuthState = {
  user:            null,
  role:            null,
  isAuthenticated: false,
  isLoading:       false,
  token:           null,
};

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  ...initialState,

  /* ── setRole — also persists to AsyncStorage so it survives hot-reload ── */
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

  /* ── setToken: pass null to clear ── */
  setToken: (token) => {
    if (token) {
      AsyncStorage.setItem(TOKEN_KEY, token).catch(console.error);
    } else {
      AsyncStorage.removeItem(TOKEN_KEY).catch(console.error);
    }
    set({ token });
  },

  setLoading: (isLoading) => set({ isLoading }),

  /* ─────────────────────────────────────────────────────────────────────
   * fetchMe — calls the correct /me/ endpoint based on current role.
   * Customers  → GET /customers/me/
   * Providers  → GET /providers/me/
   * ───────────────────────────────────────────────────────────────────── */
  fetchMe: async () => {
    const { token, role } = get();
    if (!token) return;

    const endpoint =
      role === "provider" ? "/providers/me/" : "/customers/me/";

    set({ isLoading: true });
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method:  "GET",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Token ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]).catch(console.error);
          set({ ...initialState });
        }
        return;
      }

      const data: CustomerProfile | ProviderProfile = await res.json();
      set({
        user:            data,
        role:            (data as any).role ?? role,
        isAuthenticated: true,
      });
    } catch (err) {
      console.error("[fetchMe]", err);
    } finally {
      set({ isLoading: false });
    }
  },

  /* ─────────────────────────────────────────────────────────────────────
   * logout — calls the correct logout endpoint based on role,
   * then always clears local state regardless of network result.
   * ───────────────────────────────────────────────────────────────────── */
  logout: async () => {
    const { token, role } = get();

    const endpoint =
      role === "provider" ? "/providers/logout/" : "/customers/logout/";

    if (token) {
      try {
        await fetch(`${BASE_URL}${endpoint}`, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Token ${token}`,
          },
        });
      } catch (err) {
        console.error("[logout]", err);
      }
    }

    await AsyncStorage.multiRemove([TOKEN_KEY, ROLE_KEY]).catch(console.error);
    set({ ...initialState });
  },

  /* ─────────────────────────────────────────────────────────────────────
   * hydrateToken — restores token AND role from AsyncStorage.
   * ───────────────────────────────────────────────────────────────────── */
  hydrateToken: async () => {
    try {
      const [[, token], [, role]] = await AsyncStorage.multiGet([
        TOKEN_KEY,
        ROLE_KEY,
      ]);
      if (token) set({ token });
      if (role)  set({ role: role as UserRole });
      return token;
    } catch {
      return null;
    }
  },

  /* ─────────────────────────────────────────────────────────────────────
   * hydrateAndFetch — one-shot app startup: restore token+role → fetchMe.
   *
   * Usage in app/_layout.tsx:
   *   useEffect(() => {
   *     useAuthStore.getState().hydrateAndFetch();
   *   }, []);
   * ───────────────────────────────────────────────────────────────────── */
  hydrateAndFetch: async () => {
    const token = await get().hydrateToken();
    if (token) await get().fetchMe();
  },
}));