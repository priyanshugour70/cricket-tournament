"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Trophy,
  ArrowLeft,
  MapPin,
  Users,
  Globe,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { APIResponse } from "@/types";
import type { TeamListItem } from "@/types/api/tournaments";

interface SquadPlayer {
  id: string;
  teamId: string;
  teamName: string;
  teamCode: string;
  playerId: string;
  playerName: string;
  playerRole: string;
  acquisitionType: string;
  acquisitionAmount: string | null;
  jerseyNumber: number | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isOverseas: boolean;
  isActive: boolean;
}

function fmtStatus(s: string) {
  return s.replace(/_/g, " ");
}

function fmtRole(r: string) {
  return r.replace(/_/g, " ");
}

function fmtCurrency(v: string) {
  const n = Number(v);
  if (isNaN(n)) return v;
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`;
  return n.toLocaleString("en-IN");
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    const json: APIResponse<T> = await res.json();
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

export default function TeamDetailPage() {
  const { id: tournamentId, teamId } = useParams<{
    id: string;
    teamId: string;
  }>();

  const [team, setTeam] = useState<TeamListItem | null>(null);
  const [allSquad, setAllSquad] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId || !teamId) return;

    async function load() {
      const [teamsData, squadsData] = await Promise.all([
        fetchJson<TeamListItem[]>(`/api/tournaments/${tournamentId}/teams`),
        fetchJson<SquadPlayer[]>(`/api/tournaments/${tournamentId}/squads`),
      ]);

      setTeam(teamsData?.find((t) => t.id === teamId) ?? null);
      setAllSquad(squadsData ?? []);
      setLoading(false);
    }

    load();
  }, [tournamentId, teamId]);

  const squad = useMemo(
    () => allSquad.filter((sp) => sp.teamId === teamId),
    [allSquad, teamId],
  );

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="mx-auto w-full max-w-4xl px-6 py-8">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="mt-3 h-5 w-48" />
          <Skeleton className="mt-8 h-32 w-full rounded-xl" />
          <Skeleton className="mt-6 h-60 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-semibold">Team Not Found</h2>
          <Button asChild variant="outline" className="mt-4">
            <Link href={`/tournaments/${tournamentId}`}>
              Back to Tournament
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const purseTotal = Number(team.purseTotal) || 0;
  const purseSpent = Number(team.purseSpent) || 0;
  const purseRemaining = Number(team.purseRemaining) || 0;
  const spentPercent = purseTotal > 0 ? (purseSpent / purseTotal) * 100 : 0;

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
                  {team.name}
                </h1>
                <Badge variant="secondary" className="text-xs">
                  {fmtStatus(team.status)}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium uppercase tracking-wider">
                  {team.code}
                </span>
                {team.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {team.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {team.squadCount} players
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Purse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">
                    {fmtCurrency(team.purseTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Spent</p>
                  <p className="text-lg font-bold text-red-600">
                    {fmtCurrency(team.purseSpent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {fmtCurrency(team.purseRemaining)}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {spentPercent.toFixed(0)}% spent
                  </span>
                  <span>
                    {(100 - spentPercent).toFixed(0)}% remaining
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(spentPercent, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Squad ({squad.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {squad.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/60">
                  <Users className="h-10 w-10" />
                  <p className="mt-3 text-sm">
                    No players in this squad yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">
                          #
                        </TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Acquisition</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {squad.map((sp) => (
                        <TableRow key={sp.id}>
                          <TableCell className="text-center font-mono text-sm text-muted-foreground">
                            {sp.jerseyNumber ?? "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {sp.playerName}
                              </span>
                              {sp.isCaptain && (
                                <Badge className="h-4 px-1 text-[9px]">
                                  C
                                </Badge>
                              )}
                              {sp.isViceCaptain && (
                                <Badge
                                  variant="secondary"
                                  className="h-4 px-1 text-[9px]"
                                >
                                  VC
                                </Badge>
                              )}
                              {sp.isOverseas && (
                                <Badge
                                  variant="outline"
                                  className="h-4 border-sky-200 bg-sky-500/10 px-1 text-[9px] text-sky-700"
                                >
                                  <Globe className="mr-0.5 h-2.5 w-2.5" />
                                  OS
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {fmtRole(sp.playerRole)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[11px]">
                              {fmtStatus(sp.acquisitionType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {sp.acquisitionAmount
                              ? fmtCurrency(sp.acquisitionAmount)
                              : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
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
