"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { Trophy } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

type PointsEntry = {
  position: number;
  team: { id: string; name: string; code: string };
  played: number;
  won: number;
  lost: number;
  tied: number;
  noResult: number;
  points: number;
  netRunRate: number;
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
  const [entries, setEntries] = useState<PointsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPoints = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/points-table`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      if (data.success) setEntries(data.data ?? []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

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
      <h1 className="text-xl font-semibold">Points Table</h1>

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
        <Card>
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
              {entries.map((entry, i) => (
                <TableRow
                  key={entry.team.id}
                  className={i < 4 ? "bg-green-50/50" : ""}
                >
                  <TableCell className="text-center font-bold tabular-nums">
                    {entry.position}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                        {entry.team.code}
                      </div>
                      <span className="font-medium">{entry.team.name}</span>
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
                    {entry.netRunRate >= 0 ? "+" : ""}
                    {entry.netRunRate.toFixed(3)}
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
