"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Skeleton } from "@/components/ui";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";

interface DashboardLayoutProps {
  tournamentId: string;
  children: React.ReactNode;
}

export function DashboardLayout({
  tournamentId,
  children,
}: DashboardLayoutProps) {
  const router = useRouter();
  const { user, tournamentAccesses, isAuthenticated, isLoading, logout } =
    useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  function handleTournamentChange(id: string) {
    router.push(`/dashboard/${id}`);
  }

  function handleLogout() {
    logout();
    router.push("/auth/login");
  }

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="hidden w-64 border-r border-border bg-card p-4 lg:block">
          <Skeleton className="mb-6 h-8 w-32" />
          <Skeleton className="mb-4 h-9 w-full" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="mb-4 h-8 w-64" />
          <Skeleton className="mb-8 h-5 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentAccess = tournamentAccesses.find(
    (a) => a.tournamentId === tournamentId,
  );

  const isSystemAdmin = user.systemRole === "SUPER_ADMIN" || user.systemRole === "ADMIN";
  if (!currentAccess && !isSystemAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-lg font-semibold text-destructive">Access Denied</p>
          <p className="text-sm text-muted-foreground">You do not have access to this tournament.</p>
          <Link href="/dashboard" className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <DashboardSidebar
        user={user}
        tournamentAccesses={tournamentAccesses}
        tournamentId={tournamentId}
        onTournamentChange={handleTournamentChange}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <DashboardHeader
          user={user}
          tournamentAccess={currentAccess}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
