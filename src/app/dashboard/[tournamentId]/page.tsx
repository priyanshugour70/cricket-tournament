"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import {
  Users,
  Swords,
  CheckCircle2,
  Trophy,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Skeleton,
} from "@/components/ui";

type Tournament = {
  id: string;
  name: string;
  code: string;
  status: string;
  format: string;
  season: number;
  maxTeams: number;
  oversPerInning?: number;
  venueCity?: string;
  description?: string;
};

type Team = { id: string; name: string; code: string };

type Match = {
  id: string;
  matchNo: number;
  status: string;
  scheduledAt?: string | null;
  homeTeamName: string;
  awayTeamName: string;
  resultSummary?: string | null;
};

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

const matchStatusColor: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  TOSS_PENDING: "bg-yellow-100 text-yellow-800",
  LIVE: "bg-red-100 text-red-800",
  INNINGS_BREAK: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-stone-200 text-stone-700",
  ABANDONED: "bg-muted text-muted-foreground",
};

export default function OverviewPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerCount, setPlayerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [tRes, teamsRes, matchesRes, playersRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/teams`, {
          headers: authHeaders(),
        }),
        fetch(`/api/tournaments/${tournamentId}/matches`, {
          headers: authHeaders(),
        }),
        fetch(`/api/tournaments/${tournamentId}/players`, {
          headers: authHeaders(),
        }),
      ]);

      const [tData, teamsData, matchesData, playersData] = await Promise.all([
        tRes.json(),
        teamsRes.json(),
        matchesRes.json(),
        playersRes.json(),
      ]);

      if (tData.success) setTournament(tData.data);
      if (teamsData.success) setTeams(teamsData.data ?? []);
      if (matchesData.success) setMatches(matchesData.data ?? []);
      if (playersData.success)
        setPlayerCount((playersData.data ?? []).length);
    } catch {
      /* handled by empty state */
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const completedMatches = matches.filter((m) => m.status === "COMPLETED");

  const stats = [
    {
      label: "Total Teams",
      value: teams.length,
      max: tournament?.maxTeams,
      icon: Users,
      color: "bg-blue-500/10 text-blue-600",
    },
    {
      label: "Registered Players",
      value: playerCount,
      icon: Users,
      color: "bg-green-500/10 text-green-600",
    },
    {
      label: "Matches Played",
      value: completedMatches.length,
      max: matches.length || undefined,
      icon: Swords,
      color: "bg-purple-500/10 text-purple-600",
    },
    {
      label: "Overs / Innings",
      value: tournament?.oversPerInning ?? "—",
      icon: Trophy,
      color: "bg-amber-500/10 text-amber-600",
    },
  ];

  return (
    <div className="space-y-6">
      {tournament && (
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{tournament.name}</h1>
            <Badge variant="secondary">
              {tournament.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {tournament.code} &middot; Season {tournament.season} &middot;{" "}
            {tournament.format}
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.color}`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {s.value}
                  {s.max != null && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{s.max}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tournament?.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {tournament.description}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Calendar className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No matches scheduled yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm">
                      <span className="font-medium">{m.homeTeamName}</span>
                      <span className="mx-2 text-muted-foreground">vs</span>
                      <span className="font-medium">{m.awayTeamName}</span>
                    </div>
                    {m.resultSummary && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {m.resultSummary}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={matchStatusColor[m.status] ?? "bg-muted text-muted-foreground"}
                  >
                    {m.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
