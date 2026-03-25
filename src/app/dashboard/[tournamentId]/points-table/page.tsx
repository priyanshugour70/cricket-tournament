"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { Trophy, RefreshCw, Loader2 } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

type PointsTableRow = {
  id: string;
  teamId: string;
  teamName: string;
  teamCode: string;
  position: number;
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  nrr: number;
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
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

export default function PointsTablePage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const { user } = useAuth();
  const isAdmin = user?.systemRole === "SUPER_ADMIN" || user?.systemRole === "ADMIN";

  const [entries, setEntries] = useState<PointsTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchPoints = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/points-table`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const rows: PointsTableRow[] = data.data.map((row: Record<string, unknown>) => ({
          id: String(row.id ?? ""),
          teamId: String(row.teamId ?? ""),
          teamName: String(row.teamName ?? ""),
          teamCode: String(row.teamCode ?? ""),
          position: Number(row.position ?? 0),
          played: Number(row.played ?? 0),
          won: Number(row.won ?? 0),
          lost: Number(row.lost ?? 0),
          tied: Number(row.tied ?? 0),
          noResult: Number(row.noResult ?? 0),
          points: Number(row.points ?? 0),
          nrr: Number(row.nrr ?? 0),
          runsScored: Number(row.runsScored ?? 0),
          oversFaced: Number(row.oversFaced ?? 0),
          runsConceded: Number(row.runsConceded ?? 0),
          oversBowled: Number(row.oversBowled ?? 0),
        }));
        rows.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.nrr - a.nrr;
        });
        rows.forEach((r, i) => { r.position = i + 1; });
        setEntries(rows);
      }
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      await fetch(`/api/tournaments/${tournamentId}/points-table/recalculate`, {
        method: "POST",
        headers: authHeaders(),
      });
      await fetchPoints();
    } catch {
      /* empty */
    } finally {
      setRecalculating(false);
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
        <h1 className="text-xl font-semibold">Points Table</h1>
        {isAdmin && (
          <Button size="sm" variant="outline" onClick={handleRecalculate} disabled={recalculating}>
            {recalculating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1 h-4 w-4" />}
            Recalculate
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Trophy className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No standings available</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Points table will be generated once matches are completed.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">P</TableHead>
                <TableHead className="text-center">W</TableHead>
                <TableHead className="text-center">L</TableHead>
                <TableHead className="text-center">T</TableHead>
                <TableHead className="text-center">NR</TableHead>
                <TableHead className="text-center font-bold">Pts</TableHead>
                <TableHead className="text-right">NRR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const isQualified = entry.position <= 4;
                const nrrSafe = Number.isFinite(entry.nrr) ? entry.nrr : 0;
                return (
                  <TableRow
                    key={entry.id || entry.teamId}
                    className={isQualified ? "bg-green-50/50" : ""}
                  >
                    <TableCell className="text-center font-bold tabular-nums">
                      <div className="flex items-center justify-center gap-1">
                        {entry.position}
                        {entry.position === 1 && <Trophy className="h-3.5 w-3.5 text-yellow-500" />}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                          {entry.teamCode.slice(0, 3).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium">{entry.teamName}</span>
                          {isQualified && (
                            <Badge variant="secondary" className="ml-2 text-[10px]">Q</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {entry.played}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-green-700">
                      {entry.won}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-red-600">
                      {entry.lost}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {entry.tied}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {entry.noResult}
                    </TableCell>
                    <TableCell className="text-center text-base font-bold tabular-nums">
                      {entry.points}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className={nrrSafe >= 0 ? "text-green-700" : "text-red-600"}>
                        {nrrSafe >= 0 ? "+" : ""}
                        {nrrSafe.toFixed(3)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
