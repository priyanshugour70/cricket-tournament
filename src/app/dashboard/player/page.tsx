"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Activity } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Skeleton,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import type { PlayerCareer } from "@/types/api/players";
import type { APIResponse } from "@/types";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export default function MyPlayerCareerPage() {
  const router = useRouter();
  const { linkedPlayer, isAuthenticated, isLoading: authLoading } = useAuth();
  const [career, setCareer] = useState<PlayerCareer | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!linkedPlayer) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/players/${linkedPlayer.id}/career`, { headers: authHeaders() });
      const json = (await res.json()) as APIResponse<PlayerCareer>;
      if (json.success && json.data) setCareer(json.data);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [linkedPlayer]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }
    void load();
  }, [authLoading, isAuthenticated, load, router]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!linkedPlayer) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <p className="text-lg font-medium">No player profile linked</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Link a cricket player profile to your account from registration settings, or create one after sign up.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/auth/register">Sign up with a player profile</Link>
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">
          If you already have an account, link a player profile via the API{" "}
          <code className="rounded bg-muted px-1">POST /api/auth/player-profile</code> (authenticated).
        </p>
      </div>
    );
  }

  if (!career) {
    return (
      <div className="mx-auto max-w-lg p-6 text-center">
        <p className="text-muted-foreground">Could not load career data.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dashboard">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-24">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">{career.displayName}</h1>
          <p className="text-sm text-muted-foreground">Your career · same player everywhere in the app</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Runs (bat)", career.runsOffBat],
          ["Balls faced", career.ballsAsBatsman],
          ["Wickets (bowl)", career.wicketsAsBowler],
          ["4s / 6s", `${career.fours} / ${career.sixes}`],
        ].map(([label, val]) => (
          <Card key={label as string}>
            <CardContent className="pt-6 text-center">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4" />
            Recent matches (your squads)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {career.recentMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No matches yet.</p>
          ) : (
            career.recentMatches.map((m) => (
              <div
                key={m.matchId}
                className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="font-medium">{m.homeTeamName}</span>
                  <span className="mx-1 text-muted-foreground">vs</span>
                  <span className="font-medium">{m.awayTeamName}</span>
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    {m.tournamentName}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  #{m.matchNo} · {m.status.replace(/_/g, " ")}
                  {m.resultSummary ? ` · ${m.resultSummary}` : ""}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4" />
            Recent ball involvement
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 space-y-2 overflow-y-auto">
          {career.recentBallInvolvement.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ball-by-ball data yet.</p>
          ) : (
            career.recentBallInvolvement.map((b) => (
              <div
                key={b.id}
                className="rounded-md bg-muted/40 px-3 py-2 text-xs"
              >
                <span className="font-mono text-muted-foreground">
                  {b.overNo}.{b.ballNo}
                </span>
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  {b.involvement}
                </Badge>
                <span className="ml-2">
                  {b.homeTeamName} vs {b.awayTeamName} · {b.tournamentName}
                </span>
                <p className="mt-1 text-sm">
                  {b.isWicket ? "Wicket" : `${b.totalRuns} run(s)`}
                  {b.isFour && " · FOUR"}
                  {b.isSix && " · SIX"}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
