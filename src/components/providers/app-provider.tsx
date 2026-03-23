"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";

type AppProviderProps = {
  children: ReactNode;
};

export function AppProvider({ children }: AppProviderProps) {
  return <AuthProvider>{children}</AuthProvider>;
}

