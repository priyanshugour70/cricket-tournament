"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { getMeRequest } from "@/services/client/auth.service";
import type {
  AuthResponse,
  AuthUser,
  TournamentAccessItem,
} from "@/types/api/auth";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  tournamentAccesses: TournamentAccessItem[];
  isAuthenticated: boolean;
  login: (data: AuthResponse) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tournamentAccesses, setTournamentAccesses] = useState<
    TournamentAccessItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    getMeRequest(stored)
      .then((res) => {
        if (res.data) {
          setUser(res.data.user);
          setToken(res.data.token);
          setTournamentAccesses(res.data.tournamentAccesses);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback((data: AuthResponse) => {
    setUser(data.user);
    setToken(data.token);
    setTournamentAccesses(data.tournamentAccesses);
    localStorage.setItem(TOKEN_KEY, data.token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setTournamentAccesses([]);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      tournamentAccesses,
      isAuthenticated: !!user,
      login,
      logout,
      isLoading,
    }),
    [user, token, tournamentAccesses, login, logout, isLoading],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
