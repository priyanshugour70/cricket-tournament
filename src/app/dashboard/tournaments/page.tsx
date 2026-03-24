"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Trophy } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Badge,
  Skeleton,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import type { APIResponse } from "@/types";
import type {
  CreateTournamentRequest,
  TournamentListItem,
} from "@/types/api/tournaments";

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export default function ManageTournamentsPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<TournamentListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTournamentRequest>({
    code: "",
    name: "",
    season: new Date().getFullYear(),
    pursePerTeam: 500000000,
    format: "T20",
    status: "DRAFT",
    timezone: "Asia/Kolkata",
    maxTeams: 10,
    minSquadSize: 18,
    maxSquadSize: 25,
    overseasLimit: 8,
    venueCity: "",
    country: "India",
  });

  const canManage = useMemo(
    () => user?.systemRole === "ADMIN" || user?.systemRole === "SUPER_ADMIN",
    [user],
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/auth/login");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !canManage) router.replace("/dashboard");
  }, [canManage, isAuthenticated, isLoading, router]);

  useEffect(() => {
    async function run() {
      try {
        const res = await fetch("/api/tournaments", { headers: authHeaders() });
        const json = (await res.json()) as APIResponse<TournamentListItem[]>;
        if (json.success && json.data) setItems(json.data);
      } catch {
        setError("Unable to load tournaments");
      } finally {
        setLoading(false);
      }
    }
    if (!isLoading && isAuthenticated && canManage) void run();
  }, [canManage, isAuthenticated, isLoading]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as APIResponse<TournamentListItem>;
      if (!res.ok || !json.success) {
        throw new Error(json.message ?? "Unable to create tournament");
      }
      setForm((p) => ({
        ...p,
        code: "",
        name: "",
        venueCity: "",
      }));
      const listRes = await fetch("/api/tournaments", { headers: authHeaders() });
      const listJson = (await listRes.json()) as APIResponse<TournamentListItem[]>;
      if (listJson.success && listJson.data) setItems(listJson.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create tournament");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!canManage) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manage Tournaments</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Input
                id="season"
                type="number"
                value={form.season}
                onChange={(e) =>
                  setForm((p) => ({ ...p, season: Number(e.target.value) || p.season }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.venueCity ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, venueCity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purse">Purse Per Team (INR)</Label>
              <Input
                id="purse"
                type="number"
                value={form.pursePerTeam}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    pursePerTeam: Number(e.target.value) || p.pursePerTeam,
                  }))
                }
                required
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={saving} className="w-full">
                <Plus className="h-4 w-4" />
                {saving ? "Creating..." : "Create Tournament"}
              </Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Tournaments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/${t.id}`}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40"
            >
              <div className="min-w-0">
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.code} · Season {t.season}
                </p>
              </div>
              <Badge variant="secondary">{t.status.replace(/_/g, " ")}</Badge>
            </Link>
          ))}
          {items.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center">
              <Trophy className="mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No tournaments found.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
