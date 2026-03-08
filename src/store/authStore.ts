import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthState, UserRole, CustomerProfile, ProviderProfile } from "@/types";

const TOKEN_KEY = "snapfix_auth_token";
const BASE_URL  = "https://snapfix-production.up.railway.app/api/v1"; // ← update if your base URL differs

interface AuthActions {
  setRole:          (role: UserRole) => void;
  setUser:          (user: CustomerProfile | ProviderProfile) => void;
  setToken:         (token: string) => void;
  setLoading:       (loading: boolean) => void;
  logout:           () => Promise<void>;
  hydrateToken:     () => Promise<string | null>;
  fetchMe:          () => Promise<void>;
  hydrateAndFetch:  () => Promise<void>;
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

  setRole: (role) => set({ role }),

  setUser: (user) =>
    set({
      user,
      role:            user.role,
      isAuthenticated: true,
    }),

  setToken: (token) => {
    AsyncStorage.setItem(TOKEN_KEY, token).catch(console.error);
    set({ token });
  },

  setLoading: (isLoading) => set({ isLoading }),

  /* ─────────────────────────────────────────────────────────────────────────
   * GET /api/v1/customers/me/
   * Fetches the logged-in customer's profile and stores it.
   * Requires a token already in the store — call hydrateToken() first.
   * If the server returns 401 the local session is cleared automatically.
   * ───────────────────────────────────────────────────────────────────── */
  fetchMe: async () => {
    const token = get().token;
    if (!token) return;

    set({ isLoading: true });
    try {
      const res = await fetch(`${BASE_URL}/customers/me/`, {
        method:  "GET",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Token ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          // Token expired or invalid — wipe local session
          await AsyncStorage.removeItem(TOKEN_KEY).catch(console.error);
          set({ ...initialState });
        }
        return;
      }

      /*
       * Assumed response shape (mirrors register body + id + role):
       * {
       *   id:         number,
       *   email:      string,
       *   first_name: string,
       *   last_name:  string,
       *   phone:      string,
       *   role:       "customer"
       * }
       * Adjust CustomerProfile in @/types if the real shape differs.
       */
      const data: CustomerProfile = await res.json();
      set({
        user:            data,
        role:            data.role ?? "customer",
        isAuthenticated: true,
      });
    } catch (err) {
      console.error("[fetchMe]", err);
    } finally {
      set({ isLoading: false });
    }
  },

  /* ─────────────────────────────────────────────────────────────────────────
   * POST /api/v1/customers/logout/
   * Notifies the server, then always clears local state + AsyncStorage.
   * Network failure does NOT block the local sign-out.
   * ───────────────────────────────────────────────────────────────────── */
  logout: async () => {
    const token = get().token;

    if (token) {
      try {
        await fetch(`${BASE_URL}/customers/logout/`, {
          method:  "POST",
          headers: {
            "Content-Type":  "application/json",
            "Authorization": `Token ${token}`,
          },
        });
      } catch (err) {
        // Server unreachable — still sign out locally
        console.error("[logout]", err);
      }
    }

    await AsyncStorage.removeItem(TOKEN_KEY).catch(console.error);
    set({ ...initialState });
  },

  /* ─────────────────────────────────────────────────────────────────────────
   * Reads token from AsyncStorage into the store.
   * ───────────────────────────────────────────────────────────────────── */
  hydrateToken: async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) set({ token });
      return token;
    } catch {
      return null;
    }
  },

  /* ─────────────────────────────────────────────────────────────────────────
   * One-shot app-startup call: restore token → fetch profile.
   *
   * Usage in root app/_layout.tsx:
   *
   *   useEffect(() => {
   *     useAuthStore.getState().hydrateAndFetch();
   *   }, []);
   *
   * ───────────────────────────────────────────────────────────────────── */
  hydrateAndFetch: async () => {
    const token = await get().hydrateToken();
    if (token) await get().fetchMe();
  },
}));