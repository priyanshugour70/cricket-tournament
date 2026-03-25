"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Trophy,
  ArrowLeft,
  MapPin,
  Calendar,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { APIResponse } from "@/types";
import type { MatchListItem } from "@/types/api/matches";
import type { InningsItem, CommentaryItem } from "@/types/api/scoring";

function matchStatusStyle(status: string) {
  switch (status) {
    case "LIVE":
      return "bg-red-500/10 text-red-700 border-red-200";
    case "SCHEDULED":
    case "TOSS_PENDING":
      return "bg-blue-500/10 text-blue-700 border-blue-200";
    case "INNINGS_BREAK":
      return "bg-amber-500/10 text-amber-700 border-amber-200";
    case "COMPLETED":
      return "bg-stone-500/10 text-stone-500 border-stone-200";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

function fmtStatus(s: string) {
  return s.replace(/_/g, " ");
}

function fmtDateTime(d: string | null) {
  if (!d) return "TBD";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

async function fetchJson<T>(url: string): Promise<T | null> {
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Network error — please check your connection");
  }
  if (res.status === 404) return null;
  const json: APIResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(typeof json.error === "string" ? json.error : "Server error");
  }
  return json.data ?? null;
}

export default function MatchDetailPage() {
  const { id: tournamentId, matchId } = useParams<{
    id: string;
    matchId: string;
  }>();

  const [match, setMatch] = useState<MatchListItem | null>(null);
  const [innings, setInnings] = useState<InningsItem[]>([]);
  const [commentaryMap, setCommentaryMap] = useState<
    Record<string, CommentaryItem[]>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId || !matchId) return;

    async function load() {
      const [matchesData, inningsData] = await Promise.all([
        fetchJson<MatchListItem[]>(
          `/api/tournaments/${tournamentId}/matches`,
        ),
        fetchJson<InningsItem[]>(`/api/matches/${matchId}/innings`),
      ]);

      const foundMatch = matchesData?.find((m) => m.id === matchId) ?? null;
      setMatch(foundMatch);

      const inningsArr = inningsData ?? [];
      setInnings(inningsArr);

      const commentaries: Record<string, CommentaryItem[]> = {};
      await Promise.all(
        inningsArr.map(async (inn) => {
          const data = await fetchJson<CommentaryItem[]>(
            `/api/matches/${matchId}/innings/${inn.id}/commentary`,
          );
          if (data) commentaries[inn.id] = data;
        }),
      );
      setCommentaryMap(commentaries);
      setLoading(false);
    }

    load();
  }, [tournamentId, matchId]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="mx-auto w-full max-w-4xl px-6 py-8">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="mt-3 h-5 w-96" />
          <Skeleton className="mt-8 h-40 w-full rounded-xl" />
          <Skeleton className="mt-6 h-60 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <Trophy className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-semibold">Match Not Found</h2>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/tournaments/${tournamentId}`}>
              Back to Tournament
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isLive = match.status === "LIVE" || match.status === "INNINGS_BREAK";
  const isCompleted = match.status === "COMPLETED";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <section className="border-b border-border bg-secondary/50 px-6 py-8">
        <div className="mx-auto max-w-4xl">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 text-muted-foreground"
          >
            <Link href={`/tournaments/${tournamentId}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to Tournament
            </Link>
          </Button>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {match.homeTeamName} vs {match.awayTeamName}
                </h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
                  Match #{match.matchNo}
                </span>
                <span>{fmtStatus(match.stage)}</span>
              </div>
            </div>

            <Badge
              variant="outline"
              className={cn(
                "shrink-0 px-3 py-1.5 text-sm",
                matchStatusStyle(match.status),
              )}
            >
              {isLive && (
                <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
              )}
              {fmtStatus(match.status)}
            </Badge>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {(match.venueName || match.city) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {match.venueName}
                {match.venueName && match.city && ", "}
                {match.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {fmtDateTime(match.scheduledAt)}
            </span>
          </div>

          {isCompleted && match.resultSummary && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-500/10 px-4 py-3">
              <p className="text-sm font-medium text-emerald-800">
                {match.resultSummary}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          {isLive && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-500/5 px-4 py-2">
              <Radio className="h-4 w-4 animate-pulse text-red-600" />
              <span className="text-sm font-medium text-red-700">
                This match is currently LIVE
              </span>
            </div>
          )}

          {innings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Scorecard</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {innings.map((inn) => (
                  <div
                    key={inn.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">
                          {inn.battingTeamName}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Innings {inn.inningsNo}
                          {inn.targetScore
                            ? ` · Target: ${inn.targetScore}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {inn.totalRuns}/{inn.totalWickets}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ({inn.totalOvers} ov)
                        </p>
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="flex gap-6 text-xs text-muted-foreground">
                      <span>RR: {inn.runRate}</span>
                      <span>Extras: {inn.extras}</span>
                      <span className="capitalize">
                        {fmtStatus(inn.status).toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {innings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Commentary</CardTitle>
              </CardHeader>
              <CardContent>
                {innings.map((inn) => {
                  const entries = commentaryMap[inn.id] ?? [];
                  if (entries.length === 0) return null;

                  const sorted = [...entries].sort((a, b) => {
                    if (b.overNo !== a.overNo) return b.overNo - a.overNo;
                    return (b.ballNo ?? 0) - (a.ballNo ?? 0);
                  });

                  return (
                    <div key={inn.id} className="mb-6 last:mb-0">
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                        {inn.battingTeamName} — Innings {inn.inningsNo}
                      </h4>
                      <div className="space-y-2">
                        {sorted.map((c) => (
                          <div
                            key={c.id}
                            className={cn(
                              "rounded-md border border-border px-3 py-2 text-sm",
                              c.isHighlight &&
                                "border-amber-200 bg-amber-500/10",
                            )}
                          >
                            <span className="mr-2 font-mono text-xs font-bold text-muted-foreground">
                              {c.overNo}.{c.ballNo ?? 0}
                            </span>
                            {c.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                {innings.every(
                  (inn) => (commentaryMap[inn.id] ?? []).length === 0,
                ) && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No commentary available yet.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {innings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground/60">
              <Trophy className="h-10 w-10" />
              <h3 className="mt-4 text-base font-semibold text-foreground">
                Match Not Started
              </h3>
              <p className="mt-1 text-sm">
                Scorecard and commentary will appear once the match begins.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-4xl px-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CricketTournament Pro. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">
            CricketTournament Pro
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/tournaments">Tournaments</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/register">Register</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
