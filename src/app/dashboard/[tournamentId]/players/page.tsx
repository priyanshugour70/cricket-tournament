"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  Button,
  Badge,
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

type TournamentPlayerRow = {
  registrationId: string;
  registrationNumber: string;
  status: string;
  playerId: string;
  displayName: string;
  role: string;
  battingStyle: string | null;
  bowlingStyle: string | null;
  isOverseas: boolean;
  expectedPrice: string | null;
  createdAt: string;
};

function normalizeTournamentPlayerRow(raw: unknown): TournamentPlayerRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const nested =
    r.player && typeof r.player === "object"
      ? (r.player as Record<string, unknown>)
      : null;

  const registrationId =
    typeof r.registrationId === "string"
      ? r.registrationId
      : typeof r.id === "string"
        ? r.id
        : "";
  if (!registrationId) return null;

  const displayName =
    typeof r.displayName === "string"
      ? r.displayName
      : typeof nested?.displayName === "string"
        ? nested.displayName
        : "";

  const role =
    typeof r.role === "string"
      ? r.role
      : typeof nested?.role === "string"
        ? nested.role
        : "BATTER";

  const isOverseas =
    typeof r.isOverseas === "boolean"
      ? r.isOverseas
      : Boolean(nested?.isOverseas);

  return {
    registrationId,
    registrationNumber:
      typeof r.registrationNumber === "string" ? r.registrationNumber : "",
    status: typeof r.status === "string" ? r.status : "SUBMITTED",
    playerId:
      typeof r.playerId === "string"
        ? r.playerId
        : typeof nested?.id === "string"
          ? nested.id
          : "",
    displayName,
    role,
    battingStyle:
      typeof r.battingStyle === "string" || r.battingStyle === null
        ? (r.battingStyle as string | null)
        : typeof nested?.battingStyle === "string" || nested?.battingStyle === null
          ? (nested.battingStyle as string | null)
          : null,
    bowlingStyle:
      typeof r.bowlingStyle === "string" || r.bowlingStyle === null
        ? (r.bowlingStyle as string | null)
        : typeof nested?.bowlingStyle === "string" || nested?.bowlingStyle === null
          ? (nested.bowlingStyle as string | null)
          : null,
    isOverseas,
    expectedPrice:
      typeof r.expectedPrice === "string" || r.expectedPrice === null
        ? (r.expectedPrice as string | null)
        : null,
    createdAt:
      typeof r.createdAt === "string"
        ? r.createdAt
        : new Date().toISOString(),
  };
}

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
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WAITLISTED: "bg-orange-100 text-orange-800",
};

const STATUSES = [
  "ALL",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "WAITLISTED",
];

export default function PlayersPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const [players, setPlayers] = useState<TournamentPlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/players`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        const rows = data.data
          .map(normalizeTournamentPlayerRow)
          .filter(
            (x: TournamentPlayerRow | null): x is TournamentPlayerRow =>
              x !== null,
          );
        setPlayers(rows);
      }
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  async function handleApproval(registrationId: string, approve: boolean) {
    setActionLoading(registrationId);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/registrations/approve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          registrationId,
          action: approve ? "APPROVE" : "REJECT",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const msg = typeof data.error === "string" ? data.error : data.error?.message ?? "Action failed";
        alert(`${approve ? "Approval" : "Rejection"} failed: ${msg}`);
        return;
      }
      fetchPlayers();
    } catch {
      alert("Network error — could not process registration action");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered =
    statusFilter === "ALL"
      ? players
      : players.filter((p) => p.status === statusFilter);

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">
          Players ({filtered.length})
        </h1>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-44"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No player registrations</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Players will appear here once they register.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg #</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((reg) => (
                <TableRow key={reg.registrationId}>
                  <TableCell className="font-mono text-xs">
                    {reg.registrationNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/${tournamentId}/players/${reg.playerId}`}
                      className="hover:underline"
                    >
                      {reg.displayName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm">
                    {reg.role.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    {reg.isOverseas ? (
                      <Badge variant="outline">Overseas</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Domestic
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor[reg.status] ?? ""}>
                      {reg.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {reg.status === "SUBMITTED" ||
                    reg.status === "UNDER_REVIEW" ? (
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading === reg.registrationId}
                          onClick={() => handleApproval(reg.registrationId, true)}
                          title="Approve"
                        >
                          {actionLoading === reg.registrationId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading === reg.registrationId}
                          onClick={() => handleApproval(reg.registrationId, false)}
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
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
