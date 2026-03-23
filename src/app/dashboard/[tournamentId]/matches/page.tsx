"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { use } from "react";
import { Plus, Loader2, Swords } from "lucide-react";
import {
  Button,
  Badge,
  Input,
  Label,
  Card,
  CardContent,
  Select,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

type Team = { id: string; name: string; code: string };

type Match = {
  id: string;
  matchNo: number;
  stage: string;
  status: string;
  scheduledAt?: string;
  venueName?: string;
  homeTeam: { id: string; name: string };
  awayTeam: { id: string; name: string };
  winningTeam?: { id: string; name: string };
  resultSummary?: string;
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

export default function MatchesPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [matchForm, setMatchForm] = useState({
    matchNo: "",
    homeTeamId: "",
    awayTeamId: "",
    venueName: "",
    scheduledAt: "",
  });

  const fetchData = useCallback(async () => {
    try {
      const [mRes, tRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/matches`, {
          headers: authHeaders(),
        }),
        fetch(`/api/tournaments/${tournamentId}/teams`, {
          headers: authHeaders(),
        }),
      ]);
      const [mData, tData] = await Promise.all([mRes.json(), tRes.json()]);
      if (mData.success) setMatches(mData.data ?? []);
      if (tData.success) setTeams(tData.data ?? []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleAddMatch(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...matchForm,
          matchNo: parseInt(matchForm.matchNo, 10),
          scheduledAt: matchForm.scheduledAt || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setMatchForm({
          matchNo: "",
          homeTeamId: "",
          awayTeamId: "",
          venueName: "",
          scheduledAt: "",
        });
        setShowForm(false);
        fetchData();
      }
    } catch {
      /* empty */
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Matches ({matches.length})</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Create Match
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={handleAddMatch}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="matchNo">Match Number</Label>
                <Input
                  id="matchNo"
                  type="number"
                  placeholder="1"
                  value={matchForm.matchNo}
                  onChange={(e) =>
                    setMatchForm((p) => ({ ...p, matchNo: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueName">Venue</Label>
                <Input
                  id="venueName"
                  placeholder="Wankhede Stadium"
                  value={matchForm.venueName}
                  onChange={(e) =>
                    setMatchForm((p) => ({ ...p, venueName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="homeTeam">Home Team</Label>
                <Select
                  id="homeTeam"
                  value={matchForm.homeTeamId}
                  onChange={(e) =>
                    setMatchForm((p) => ({
                      ...p,
                      homeTeamId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="awayTeam">Away Team</Label>
                <Select
                  id="awayTeam"
                  value={matchForm.awayTeamId}
                  onChange={(e) =>
                    setMatchForm((p) => ({
                      ...p,
                      awayTeamId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Select team</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="scheduledAt">Scheduled At</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={matchForm.scheduledAt}
                  onChange={(e) =>
                    setMatchForm((p) => ({
                      ...p,
                      scheduledAt: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-span-full flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Match
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Swords className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No matches scheduled</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first match to build the schedule.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Match</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-xs">
                    {m.matchNo}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{m.homeTeam.name}</span>
                    <span className="mx-1.5 text-muted-foreground">vs</span>
                    <span className="font-medium">{m.awayTeam.name}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.venueName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.scheduledAt
                      ? new Date(m.scheduledAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "TBD"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={matchStatusColor[m.status] ?? ""}
                    >
                      {m.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                    {m.resultSummary ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
