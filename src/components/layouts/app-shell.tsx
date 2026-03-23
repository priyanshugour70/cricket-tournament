import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

export function AppShell({ children, className }: AppShellProps) {
  return <main className={cn("mx-auto w-full max-w-6xl p-8", className)}>{children}</main>;
}

