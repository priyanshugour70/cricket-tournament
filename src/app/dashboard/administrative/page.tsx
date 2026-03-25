"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Users, KeyRound, ArrowLeft } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function AdministrativeHubPage() {
  const router = useRouter();
  const { hasPermission, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (!hasPermission("admin.access")) router.replace("/dashboard");
  }, [isLoading, isAuthenticated, hasPermission, router]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <Skeleton className="h-10 w-48" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (!hasPermission("admin.access")) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
          <p className="text-sm text-muted-foreground">RBAC-controlled tools for your platform</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {hasPermission("admin.users.read") && (
          <Link href="/dashboard/administrative/users">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Users</CardTitle>
                <CardDescription>View accounts, system roles, and active status</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Requires <code className="rounded bg-muted px-1">admin.users.read</code>
              </CardContent>
            </Card>
          </Link>
        )}
        {hasPermission("admin.rbac.manage") && (
          <Link href="/dashboard/administrative/rbac">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardHeader>
                <KeyRound className="mb-2 h-8 w-8 text-primary" />
                <CardTitle className="text-lg">Roles & permissions</CardTitle>
                <CardDescription>Edit which system roles grant which permission keys</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Requires <code className="rounded bg-muted px-1">admin.rbac.manage</code>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-start gap-3 pt-6 text-sm text-muted-foreground">
          <Shield className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Tournament-specific access (owner, scorer, etc.) stays under each tournament. This area only
            manages <strong>system-wide</strong> roles and permission keys stored in the database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
