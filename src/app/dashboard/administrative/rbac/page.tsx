"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import type { APIResponse } from "@/types";

type Perm = { id: string; key: string; label: string; description: string | null };
type MatrixPayload = {
  permissions: Perm[];
  matrix: Record<string, string[]>;
  roles: string[];
};

function authHeaders(token: string | null): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export default function AdministrativeRbacPage() {
  const router = useRouter();
  const { token, hasPermission, isAuthenticated, isLoading } = useAuth();
  const [payload, setPayload] = useState<MatrixPayload | null>(null);
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/rbac", { headers: authHeaders(token) });
      const json = (await res.json()) as APIResponse<MatrixPayload>;
      if (!res.ok || !json.success || !json.data) {
        throw new Error(typeof json.error === "string" ? json.error : "Failed to load RBAC");
      }
      setPayload(json.data);
      setMatrix(json.data.matrix);
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
    if (!hasPermission("admin.rbac.manage")) {
      router.replace("/dashboard/administrative");
      return;
    }
    void load();
  }, [isLoading, isAuthenticated, hasPermission, load, router]);

  function toggle(permKey: string, role: string) {
    setMatrix((m) => {
      const cur = m[permKey] ?? [];
      const next = cur.includes(role) ? cur.filter((r) => r !== role) : [...cur, role];
      return { ...m, [permKey]: next };
    });
  }

  async function save() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/rbac", {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ matrix }),
      });
      const json = (await res.json()) as APIResponse<MatrixPayload>;
      if (!res.ok || !json.success || !json.data) {
        throw new Error(typeof json.error === "string" ? json.error : "Save failed");
      }
      setPayload(json.data);
      setMatrix(json.data.matrix);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-96 w-full" />
      </div>
    );
  }

  if (!hasPermission("admin.rbac.manage") || !payload) return null;

  const roles = payload.roles;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/administrative">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold">Roles & permissions</h1>
            <p className="text-sm text-muted-foreground">Changes apply on next request (sessions keep current JWT until refresh)</p>
          </div>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save matrix
        </Button>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission matrix</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Permission</th>
                {roles.map((r) => (
                  <th key={r} className="pb-3 px-1 text-center font-medium">
                    {r.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payload.permissions.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="py-3 pr-4">
                    <div className="font-mono text-xs text-primary">{p.key}</div>
                    <div className="text-muted-foreground">{p.label}</div>
                  </td>
                  {roles.map((r) => (
                    <td key={r} className="px-1 py-3 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={(matrix[p.key] ?? []).includes(r)}
                        onChange={() => toggle(p.key, r)}
                        aria-label={`${p.key} for ${r}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
