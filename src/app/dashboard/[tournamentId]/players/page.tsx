"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
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

type PlayerRegistration = {
  id: string;
  status: string;
  registrationNumber: string;
  jerseyName?: string;
  player: {
    id: string;
    displayName: string;
    role: string;
    battingStyle?: string;
    bowlingStyle?: string;
    isOverseas: boolean;
  };
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
  const [players, setPlayers] = useState<PlayerRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/players`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) setPlayers(data.data ?? []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  async function handleApproval(registrationIds: string[], approve: boolean) {
    setActionLoading(registrationIds[0]);
    try {
      await fetch(`/api/tournaments/${tournamentId}/registrations/approve`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          registrationIds,
          action: approve ? "APPROVED" : "REJECTED",
        }),
      });
      fetchPlayers();
    } catch {
      /* empty */
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
                <TableRow key={reg.id}>
                  <TableCell className="font-mono text-xs">
                    {reg.registrationNumber}
                  </TableCell>
                  <TableCell className="font-medium">
                    {reg.player.displayName}
                  </TableCell>
                  <TableCell className="text-sm">
                    {reg.player.role.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    {reg.player.isOverseas ? (
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
                          disabled={actionLoading === reg.id}
                          onClick={() => handleApproval([reg.id], true)}
                          title="Approve"
                        >
                          {actionLoading === reg.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actionLoading === reg.id}
                          onClick={() => handleApproval([reg.id], false)}
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
