"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { use } from "react";
import { Gavel, Plus, Loader2, Clock } from "lucide-react";
import {
  Button,
  Badge,
  Input,
  Label,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
  Separator,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

type AuctionSeries = {
  id: string;
  name: string;
  status: string;
  sequenceNo: number;
  roundCount: number;
  totalPlayersSold: number;
  totalAmountSpent: string;
};

type Team = { id: string; name: string };
type Player = { id: string; displayName: string };

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

const statusColor: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  OPEN: "bg-green-100 text-green-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-stone-200 text-stone-700",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function AuctionPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const [series, setSeries] = useState<AuctionSeries[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [savingSeries, setSavingSeries] = useState(false);
  const [seriesName, setSeriesName] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [sRes, tRes, pRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/auction/series`, {
          headers: authHeaders(),
        }),
        fetch(`/api/tournaments/${tournamentId}/teams`, {
          headers: authHeaders(),
        }),
        fetch(`/api/tournaments/${tournamentId}/players`, {
          headers: authHeaders(),
        }),
      ]);

      const [sData, tData, pData] = await Promise.all([
        sRes.json().catch(() => ({ success: false })),
        tRes.json(),
        pRes.json(),
      ]);

      if (sData.success) setSeries(sData.data ?? []);
      if (tData.success) setTeams(tData.data ?? []);
      if (pData.success) {
        const mapped = (pData.data ?? []).map((r: { playerId: string; displayName: string }) => ({
          id: r.playerId,
          displayName: r.displayName,
        }));
        setPlayers(mapped);
      }
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreateSeries(e: FormEvent) {
    e.preventDefault();
    setSavingSeries(true);
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/auction/series`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({
            name: seriesName,
            sequenceNo: (series.at(-1)?.sequenceNo ?? 0) + 1,
          }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setSeriesName("");
        setShowSeriesForm(false);
        fetchData();
      }
    } catch {
      /* empty */
    } finally {
      setSavingSeries(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Auction</h1>
        <Button size="sm" onClick={() => setShowSeriesForm(!showSeriesForm)}>
          <Plus className="h-4 w-4" />
          New Series
        </Button>
      </div>

      {showSeriesForm && (
        <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={handleCreateSeries}
              className="flex items-end gap-3"
            >
              <div className="flex-1 space-y-2">
                <Label htmlFor="seriesName">Series Name</Label>
                <Input
                  id="seriesName"
                  placeholder="Main Auction 2026"
                  value={seriesName}
                  onChange={(e) => setSeriesName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={savingSeries}>
                {savingSeries && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowSeriesForm(false)}
              >
                Cancel
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {series.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Gavel className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Auction Management</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Create an auction series to start managing player auctions. Each
              series can have multiple rounds with base prices and bids.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {series.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{s.name}</CardTitle>
                  <Badge className={statusColor[s.status] ?? ""}>
                    {s.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 rounded-lg border border-border p-4 text-sm md:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Sequence</p>
                    <p className="font-medium">#{s.sequenceNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rounds</p>
                    <p className="font-medium">{s.roundCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Players sold</p>
                    <p className="font-medium">{s.totalPlayersSold}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Amount spent</p>
                    <p className="font-medium">{s.totalAmountSpent}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
