"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Plus, LogOut, ChevronRight } from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
  Separator,
} from "@/components/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user, tournamentAccesses, isAuthenticated, isLoading, logout } =
    useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  function handleLogout() {
    logout();
    router.push("/auth/login");
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl p-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin =
    user.systemRole === "ADMIN" || user.systemRole === "SUPER_ADMIN";
  const initials =
    (user.firstName?.charAt(0) ?? "") + (user.lastName?.charAt(0) ?? "");

  return (
    <div className="mx-auto w-full max-w-6xl p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome, {user.displayName}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button asChild>
              <Link href="/tournaments">
                <Plus className="h-4 w-4" />
                Create Tournament
              </Link>
            </Button>
          )}
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Badge variant="secondary">{user.systemRole.replace(/_/g, " ")}</Badge>
        <span className="text-sm text-muted-foreground">
          {tournamentAccesses.length} tournament
          {tournamentAccesses.length !== 1 ? "s" : ""}
        </span>
      </div>

      <Separator className="my-8" />

      <div>
        <h2 className="mb-4 text-lg font-semibold">Your Tournaments</h2>

        {tournamentAccesses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-12 text-center">
              <Trophy className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <p className="text-lg font-medium">No tournaments yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isAdmin
                  ? "Create your first tournament to get started."
                  : "You haven't been added to any tournaments."}
              </p>
              {isAdmin && (
                <Button className="mt-4" asChild>
                  <Link href="/tournaments">
                    <Plus className="h-4 w-4" />
                    Create Tournament
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tournamentAccesses.map((access) => (
              <Link
                key={access.tournamentId}
                href={`/dashboard/${access.tournamentId}`}
              >
                <Card className="group cursor-pointer transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Trophy className="h-5 w-5 text-primary" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                    <CardTitle className="mt-2">
                      {access.tournamentName}
                    </CardTitle>
                    <CardDescription>{access.tournamentCode}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {access.role.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
