"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  Skeleton,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import type { APIResponse } from "@/types";

type UserRow = {
  id: string;
  email: string;
  displayName: string;
  systemRole: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

const ROLES = ["SUPER_ADMIN", "ADMIN", "USER", "PLAYER"] as const;

function authHeaders(token: string | null): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export default function AdministrativeUsersPage() {
  const router = useRouter();
  const { token, hasPermission, isAuthenticated, isLoading } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { headers: authHeaders(token) });
      const json = (await res.json()) as APIResponse<UserRow[]>;
      if (!res.ok || !json.success || !json.data) {
        throw new Error(typeof json.error === "string" ? json.error : "Failed to load users");
      }
      setRows(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth/login");
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (!hasPermission("admin.users.read")) {
      router.replace("/dashboard");
      return;
    }
    void load();
  }, [isLoading, isAuthenticated, hasPermission, load, router]);

  async function patchUser(id: string, body: Record<string, unknown>) {
    if (!token || !hasPermission("admin.users.write")) return;
    setSavingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: authHeaders(token),
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as APIResponse<UserRow>;
      if (!res.ok || !json.success) {
        throw new Error(typeof json.error === "string" ? json.error : "Update failed");
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingId(null);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-96 w-full" />
      </div>
    );
  }

  if (!hasPermission("admin.users.read")) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/administrative">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">System users</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accounts</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">User</th>
                <th className="pb-2 pr-4 font-medium">Role</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Last login</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-b border-border/60">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{u.displayName}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </td>
                  <td className="py-3 pr-4">
                    {hasPermission("admin.users.write") ? (
                      <div className="flex items-center gap-2">
                        <Select
                          value={u.systemRole}
                          onChange={(e) =>
                            void patchUser(u.id, { systemRole: e.target.value })
                          }
                          disabled={savingId === u.id}
                          className="h-9 w-[160px]"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r.replace(/_/g, " ")}
                            </option>
                          ))}
                        </Select>
                        {savingId === u.id && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                    ) : (
                      <Badge variant="secondary">{u.systemRole.replace(/_/g, " ")}</Badge>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    {hasPermission("admin.users.write") ? (
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-input"
                          checked={u.isActive}
                          onChange={(e) => void patchUser(u.id, { isActive: e.target.checked })}
                          disabled={savingId === u.id}
                        />
                        {u.isActive ? "Active" : "Disabled"}
                      </label>
                    ) : (
                      <Badge variant={u.isActive ? "default" : "outline"}>
                        {u.isActive ? "Active" : "Disabled"}
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 text-xs text-muted-foreground">
                    {u.lastLoginAt
                      ? new Date(u.lastLoginAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
