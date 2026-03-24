"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Trophy,
  MapPin,
  Calendar,
  Users,
  ArrowLeft,
  Globe,
  Shield,
  Shirt,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { APIResponse } from "@/types";
import type {
  TournamentDetails,
  TeamListItem,
  TournamentPlayerItem,
} from "@/types/api/tournaments";
import type { MatchListItem } from "@/types/api/matches";

interface PointsEntry {
  id: string;
  teamId: string;
  teamName: string;
  teamCode: string;
  teamShortName: string | null;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: string;
  nrr: string;
  position: number;
  groupName: string | null;
}

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

function statusStyle(status: string) {
  switch (status) {
    case "LIVE":
      return "bg-red-500/10 text-red-700 border-red-200";
    case "REGISTRATION_OPEN":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    case "REGISTRATION_CLOSED":
    case "AUCTION_SCHEDULED":
      return "bg-amber-500/10 text-amber-700 border-amber-200";
    case "AUCTION_IN_PROGRESS":
      return "bg-violet-500/10 text-violet-700 border-violet-200";
    case "AUCTION_COMPLETED":
    case "SCHEDULE_READY":
      return "bg-blue-500/10 text-blue-700 border-blue-200";
    case "COMPLETED":
      return "bg-stone-500/10 text-stone-500 border-stone-200";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

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

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtDateTime(d: string | null) {
  if (!d) return "TBD";
  return new Date(d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtStatus(s: string) {
  return s.replace(/_/g, " ");
}

function fmtRole(r: string) {
  return r.replace(/_/g, " ");
}

function fmtStyle(s: string | null) {
  if (!s) return "—";
  return s.replace(/_/g, " ");
}

function fmtCurrency(v: string) {
  const n = Number(v);
  if (isNaN(n)) return v;
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L`;
  return n.toLocaleString("en-IN");
}

const STAGE_ORDER: Record<string, number> = {
  LEAGUE: 0,
  QUALIFIER_1: 1,
  QUALIFIER_2: 2,
  ELIMINATOR: 3,
  SEMI_FINAL: 4,
  FINAL: 5,
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    const json: APIResponse<T> = await res.json();
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [tournament, setTournament] = useState<TournamentDetails | null>(null);
  const [teams, setTeams] = useState<TeamListItem[]>([]);
  const [players, setPlayers] = useState<TournamentPlayerItem[]>([]);
  const [matches, setMatches] = useState<MatchListItem[]>([]);
  const [points, setPoints] = useState<PointsEntry[]>([]);
  const [squads, setSquads] = useState<SquadPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetchJson<TournamentDetails>(`/api/tournaments/${id}`).then(setTournament),
      fetchJson<TeamListItem[]>(`/api/tournaments/${id}/teams`).then((d) =>
        setTeams(d ?? []),
      ),
      fetchJson<TournamentPlayerItem[]>(
        `/api/tournaments/${id}/players`,
      ).then((d) => setPlayers(d ?? [])),
      fetchJson<MatchListItem[]>(`/api/tournaments/${id}/matches`).then((d) =>
        setMatches(d ?? []),
      ),
      fetchJson<PointsEntry[]>(`/api/tournaments/${id}/points-table`).then(
        (d) => setPoints(d ?? []),
      ),
      fetchJson<SquadPlayer[]>(`/api/tournaments/${id}/squads`).then((d) =>
        setSquads(d ?? []),
      ),
    ]).finally(() => setLoading(false));
  }, [id]);

  const matchesByStage = useMemo(() => {
    const groups: Record<string, MatchListItem[]> = {};
    for (const m of matches) {
      const stage = m.stage ?? "LEAGUE";
      if (!groups[stage]) groups[stage] = [];
      groups[stage].push(m);
    }
    return Object.entries(groups).sort(
      ([a], [b]) => (STAGE_ORDER[a] ?? 99) - (STAGE_ORDER[b] ?? 99),
    );
  }, [matches]);

  const squadsByTeam = useMemo(() => {
    const groups: Record<string, { teamName: string; teamCode: string; players: SquadPlayer[] }> = {};
    for (const sp of squads) {
      if (!groups[sp.teamId]) {
        groups[sp.teamId] = {
          teamName: sp.teamName,
          teamCode: sp.teamCode,
          players: [],
        };
      }
      groups[sp.teamId].players.push(sp);
    }
    return Object.entries(groups);
  }, [squads]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <PageHeader />
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-3 h-5 w-96" />
          <Skeleton className="mt-8 h-10 w-full max-w-lg" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex min-h-screen flex-col">
        <PageHeader />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <Trophy className="h-12 w-12 text-muted-foreground/40" />
          <h2 className="mt-4 text-lg font-semibold">Tournament Not Found</h2>
          <Button asChild variant="outline" className="mt-4">
            <Link href="/tournaments">Back to Tournaments</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader />

      <section className="border-b border-border bg-secondary/50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-4 -ml-2 text-muted-foreground"
          >
            <Link href="/tournaments">
              <ArrowLeft className="mr-1 h-4 w-4" />
              All Tournaments
            </Link>
          </Button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {tournament.name}
                </h1>
                <Badge
                  variant="outline"
                  className={cn("text-xs", statusStyle(tournament.status))}
                >
                  {tournament.status === "LIVE" && (
                    <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                  )}
                  {fmtStatus(tournament.status)}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <Badge variant="secondary">{tournament.format}</Badge>
                <span>Season {tournament.season}</span>
                <span className="text-border">|</span>
                <span>{tournament.code}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {tournament.teamCount} Teams
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {tournament.matchCount} Matches
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="points">Points Table</TabsTrigger>
              <TabsTrigger value="squads">Squads</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <OverviewTab tournament={tournament} />
            </TabsContent>

            <TabsContent value="teams" className="mt-6">
              <TeamsTab teams={teams} tournamentId={id} />
            </TabsContent>

            <TabsContent value="players" className="mt-6">
              <PlayersTab players={players} />
            </TabsContent>

            <TabsContent value="schedule" className="mt-6">
              <ScheduleTab
                matchesByStage={matchesByStage}
                tournamentId={id}
              />
            </TabsContent>

            <TabsContent value="points" className="mt-6">
              <PointsTab points={points} />
            </TabsContent>

            <TabsContent value="squads" className="mt-6">
              <SquadsTab
                squadsByTeam={squadsByTeam}
                tournamentId={id}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CricketTournament Pro. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}

function PageHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
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

function OverviewTab({ tournament }: { tournament: TournamentDetails }) {
  const infoRows: { label: string; value: string }[] = [
    { label: "Format", value: tournament.format },
    { label: "Season", value: String(tournament.season) },
    {
      label: "Starts",
      value: fmtDate(tournament.startsOn),
    },
    {
      label: "Ends",
      value: fmtDate(tournament.endsOn),
    },
    {
      label: "Venue City",
      value: tournament.venueCity ?? "—",
    },
    {
      label: "Country",
      value: tournament.country ?? "—",
    },
    {
      label: "Timezone",
      value: tournament.timezone,
    },
    {
      label: "Purse per Team",
      value: fmtCurrency(tournament.pursePerTeam),
    },
    {
      label: "Max Teams",
      value: String(tournament.maxTeams),
    },
    {
      label: "Squad Size",
      value: `${tournament.minSquadSize} – ${tournament.maxSquadSize}`,
    },
    {
      label: "Overseas Limit",
      value: String(tournament.overseasLimit),
    },
    {
      label: "Organizer",
      value: tournament.organizerName ?? "—",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tournament Info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            {infoRows.map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <dt className="text-muted-foreground">{row.label}</dt>
                <dd className="font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-2xl font-bold">{tournament.teamCount}</p>
              <p className="text-xs text-muted-foreground">Teams</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-2xl font-bold">
                {tournament.playerRegistrationCount}
              </p>
              <p className="text-xs text-muted-foreground">Players</p>
            </div>
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-2xl font-bold">{tournament.matchCount}</p>
              <p className="text-xs text-muted-foreground">Matches</p>
            </div>
          </div>
          {tournament.notes && (
            <>
              <Separator />
              <div>
                <h4 className="mb-1 text-sm font-medium">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {tournament.notes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TeamsTab({
  teams,
  tournamentId,
}: {
  teams: TeamListItem[];
  tournamentId: string;
}) {
  if (teams.length === 0) {
    return (
      <EmptyState
        icon={<Shield className="h-10 w-10" />}
        title="No Teams Yet"
        description="Teams will appear here once they are added to the tournament."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`/tournaments/${tournamentId}/teams/${team.id}`}
        >
          <Card className="h-full transition-all hover:shadow-md hover:border-ring/50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{team.name}</CardTitle>
                  <p className="mt-0.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {team.code}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {fmtStatus(team.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {team.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {team.city}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {team.squadCount} players
              </span>
              <span className="flex items-center gap-1.5">
                Purse: {fmtCurrency(team.purseRemaining)} remaining
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function PlayersTab({ players }: { players: TournamentPlayerItem[] }) {
  if (players.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-10 w-10" />}
        title="No Registered Players"
        description="Players will appear here once they register for the tournament."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Batting</TableHead>
                <TableHead>Bowling</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((p, idx) => (
                <TableRow key={p.registrationId}>
                  <TableCell className="text-muted-foreground">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{p.displayName}</span>
                      {p.isOverseas && (
                        <Badge
                          variant="outline"
                          className="border-sky-200 bg-sky-500/10 text-sky-700 text-[10px]"
                        >
                          <Globe className="mr-0.5 h-3 w-3" />
                          OS
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {fmtRole(p.role)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtStyle(p.battingStyle)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {fmtStyle(p.bowlingStyle)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px]",
                        p.status === "APPROVED"
                          ? "border-emerald-200 bg-emerald-500/10 text-emerald-700"
                          : p.status === "REJECTED"
                            ? "border-red-200 bg-red-500/10 text-red-700"
                            : "border-border",
                      )}
                    >
                      {fmtStatus(p.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {p.expectedPrice && (
                      <span className="text-sm text-muted-foreground">
                        {fmtCurrency(p.expectedPrice)}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleTab({
  matchesByStage,
  tournamentId,
}: {
  matchesByStage: [string, MatchListItem[]][];
  tournamentId: string;
}) {
  if (matchesByStage.length === 0) {
    return (
      <EmptyState
        icon={<Calendar className="h-10 w-10" />}
        title="No Matches Scheduled"
        description="The match schedule will appear here once fixtures are created."
      />
    );
  }

  return (
    <div className="space-y-8">
      {matchesByStage.map(([stage, stageMatches]) => (
        <div key={stage}>
          <h3 className="mb-4 text-lg font-semibold">{fmtStatus(stage)}</h3>
          <div className="space-y-3">
            {stageMatches.map((m) => (
              <Link
                key={m.id}
                href={`/tournaments/${tournamentId}/matches/${m.id}`}
              >
                <Card className="transition-all hover:shadow-sm hover:border-ring/50">
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                        #{m.matchNo}
                      </span>
                      <div>
                        <p className="font-medium">
                          {m.homeTeamName} vs {m.awayTeamName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.venueName
                            ? `${m.venueName}${m.city ? `, ${m.city}` : ""}`
                            : m.city ?? "TBD"}
                          {" · "}
                          {fmtDateTime(m.scheduledAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {m.resultSummary && (
                        <span className="text-xs text-muted-foreground">
                          {m.resultSummary}
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 text-[11px]",
                          matchStatusStyle(m.status),
                        )}
                      >
                        {m.status === "LIVE" && (
                          <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                        )}
                        {fmtStatus(m.status)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PointsTab({ points }: { points: PointsEntry[] }) {
  if (points.length === 0) {
    return (
      <EmptyState
        icon={<Trophy className="h-10 w-10" />}
        title="Points Table Unavailable"
        description="The points table will be available once matches are played."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center font-bold">
                  Pos
                </TableHead>
                <TableHead className="font-bold">Team</TableHead>
                <TableHead className="text-center font-bold">P</TableHead>
                <TableHead className="text-center font-bold">W</TableHead>
                <TableHead className="text-center font-bold">L</TableHead>
                <TableHead className="text-center font-bold">T</TableHead>
                <TableHead className="text-center font-bold">NR</TableHead>
                <TableHead className="text-center font-bold">Pts</TableHead>
                <TableHead className="text-right font-bold">NRR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {points.map((entry, idx) => (
                <TableRow
                  key={entry.id}
                  className={cn(
                    idx < 4 && "bg-emerald-500/[0.03]",
                    idx === 3 && "border-b-2 border-b-emerald-200",
                  )}
                >
                  <TableCell className="text-center font-bold">
                    {entry.position || idx + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{entry.teamName}</span>
                      <span className="text-xs text-muted-foreground">
                        {entry.teamCode}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{entry.played}</TableCell>
                  <TableCell className="text-center font-medium text-emerald-700">
                    {entry.won}
                  </TableCell>
                  <TableCell className="text-center text-red-600">
                    {entry.lost}
                  </TableCell>
                  <TableCell className="text-center">{entry.tied}</TableCell>
                  <TableCell className="text-center">
                    {entry.noResult}
                  </TableCell>
                  <TableCell className="text-center text-lg font-bold">
                    {entry.points}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono text-sm",
                      Number(entry.nrr) > 0
                        ? "text-emerald-700"
                        : Number(entry.nrr) < 0
                          ? "text-red-600"
                          : "",
                    )}
                  >
                    {Number(entry.nrr) > 0 ? "+" : ""}
                    {entry.nrr}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function SquadsTab({
  squadsByTeam,
  tournamentId,
}: {
  squadsByTeam: [string, { teamName: string; teamCode: string; players: SquadPlayer[] }][];
  tournamentId: string;
}) {
  if (squadsByTeam.length === 0) {
    return (
      <EmptyState
        icon={<Shirt className="h-10 w-10" />}
        title="No Squads Yet"
        description="Squad details will appear once players are assigned to teams."
      />
    );
  }

  return (
    <div className="space-y-8">
      {squadsByTeam.map(([teamId, { teamName, teamCode, players: teamPlayers }]) => (
        <div key={teamId}>
          <div className="mb-4 flex items-center gap-3">
            <Link href={`/tournaments/${tournamentId}/teams/${teamId}`}>
              <h3 className="text-lg font-semibold hover:underline">
                {teamName}
              </h3>
            </Link>
            <Badge variant="secondary" className="text-xs">
              {teamCode}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {teamPlayers.length} players
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {teamPlayers.map((sp) => (
              <Card key={sp.id} className="relative">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground">
                    {sp.jerseyNumber ?? "—"}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium">{sp.playerName}</p>
                      {sp.isCaptain && (
                        <Badge className="h-4 px-1 text-[9px]">C</Badge>
                      )}
                      {sp.isViceCaptain && (
                        <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                          VC
                        </Badge>
                      )}
                      {sp.isOverseas && (
                        <Badge
                          variant="outline"
                          className="h-4 border-sky-200 bg-sky-500/10 px-1 text-[9px] text-sky-700"
                        >
                          OS
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fmtRole(sp.playerRole)}
                      {sp.acquisitionAmount &&
                        ` · ${fmtCurrency(sp.acquisitionAmount)}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground/60">
      {icon}
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  );
}
