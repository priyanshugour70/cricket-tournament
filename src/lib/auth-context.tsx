"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  getMeRequest,
  logoutRequest,
  refreshTokenRequest,
} from "@/services/client/auth.service";
import type {
  AuthResponse,
  AuthUser,
  LinkedPlayerSummary,
  TournamentAccessItem,
} from "@/types/api/auth";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  tournamentAccesses: TournamentAccessItem[];
  linkedPlayer: LinkedPlayerSummary | null;
  /** Permission keys for the current user's system role (RBAC). */
  permissions: string[];
  hasPermission: (key: string) => boolean;
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const REFRESH_KEY = "auth_refresh_token";

const REFRESH_INTERVAL_MS = 45 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tournamentAccesses, setTournamentAccesses] = useState<
    TournamentAccessItem[]
  >([]);
  const [linkedPlayer, setLinkedPlayer] = useState<LinkedPlayerSummary | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTokenRef = useRef<string | null>(null);

  const persistTokens = useCallback((data: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    if (data.refreshToken) {
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      refreshTokenRef.current = data.refreshToken;
    }
  }, []);

  const clearStorage = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    refreshTokenRef.current = null;
  }, []);

  const applyAuthResponse = useCallback(
    (data: AuthResponse) => {
      setUser(data.user);
      setToken(data.token);
      setTournamentAccesses(data.tournamentAccesses);
      setLinkedPlayer(data.linkedPlayer ?? null);
      setPermissions(data.permissions ?? []);
      persistTokens(data);
    },
    [persistTokens],
  );

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const rt =
      refreshTokenRef.current ?? localStorage.getItem(REFRESH_KEY);
    if (!rt) return false;
    try {
      const res = await refreshTokenRequest(rt);
      if (res.data) {
        applyAuthResponse(res.data);
        return true;
      }
    } catch {
      /* fall through */
    }
    return false;
  }, [applyAuthResponse]);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    const storedRefresh = localStorage.getItem(REFRESH_KEY);
    refreshTokenRef.current = storedRefresh;

    if (!stored) {
      setIsLoading(false);
      return;
    }

    const accessToken = stored;
    let cancelled = false;

    async function hydrate() {
      try {
        const res = await getMeRequest(accessToken);
        if (cancelled || !res.data) return;
        setUser(res.data.user);
        setToken(res.data.token);
        setTournamentAccesses(res.data.tournamentAccesses);
        setLinkedPlayer(res.data.linkedPlayer ?? null);
        setPermissions(res.data.permissions ?? []);
      } catch {
        if (!storedRefresh) {
          if (!cancelled) {
            clearStorage();
            setUser(null);
            setToken(null);
            setTournamentAccesses([]);
            setLinkedPlayer(null);
            setPermissions([]);
          }
        } else {
          try {
            const res = await refreshTokenRequest(storedRefresh);
            if (cancelled || !res.data) return;
            applyAuthResponse(res.data);
          } catch {
            if (!cancelled) {
              clearStorage();
              setUser(null);
              setToken(null);
              setTournamentAccesses([]);
              setLinkedPlayer(null);
              setPermissions([]);
            }
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [applyAuthResponse, clearStorage]);

  useEffect(() => {
    if (!user) return;
    const rt = refreshTokenRef.current ?? localStorage.getItem(REFRESH_KEY);
    if (!rt) return;

    const id = window.setInterval(() => {
      void refreshSession();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [user, refreshSession]);

  const login = useCallback(
    (data: AuthResponse) => {
      applyAuthResponse(data);
    },
    [applyAuthResponse],
  );

  const logout = useCallback(async () => {
    const access = localStorage.getItem(TOKEN_KEY);
    const refresh = localStorage.getItem(REFRESH_KEY);
    try {
      await logoutRequest(access, refresh);
    } finally {
      setUser(null);
      setToken(null);
      setTournamentAccesses([]);
      setLinkedPlayer(null);
      setPermissions([]);
      clearStorage();
    }
  }, [clearStorage]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      tournamentAccesses,
      linkedPlayer,
      permissions,
      hasPermission: (key: string) => permissions.includes(key),
      isAuthenticated: !!user,
      login,
      logout,
      isLoading,
      refreshSession,
    }),
    [user, token, tournamentAccesses, linkedPlayer, permissions, login, logout, isLoading, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
