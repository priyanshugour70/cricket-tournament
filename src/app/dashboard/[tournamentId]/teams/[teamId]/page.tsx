"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import type { TeamListItem } from "@/types/api/tournaments";
import type { APIResponse } from "@/types";

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export default function TeamDetailsPage() {
  const { tournamentId, teamId } = useParams<{ tournamentId: string; teamId: string }>();
  const [team, setTeam] = useState<TeamListItem | null>(null);
  const [allTeams, setAllTeams] = useState<TeamListItem[]>([]);

  useEffect(() => {
    async function run() {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        headers: authHeaders(),
      });
      const json = (await res.json()) as APIResponse<TeamListItem[]>;
      if (json.success && json.data) {
        setAllTeams(json.data);
        setTeam(json.data.find((x) => x.id === teamId) ?? null);
      }
    }
    void run();
  }, [teamId, tournamentId]);

  const index = useMemo(
    () => allTeams.findIndex((x) => x.id === teamId),
    [allTeams, teamId],
  );

  if (!team) return <div className="p-6 text-sm text-muted-foreground">Loading team...</div>;

  return (
    <div className="space-y-4 p-2">
      <Button variant="ghost" asChild>
        <Link href={`/dashboard/${tournamentId}/teams`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Teams
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {team.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Code</p>
            <p>{team.code}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant="secondary">{team.status}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">City</p>
            <p>{team.city ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Squad Count</p>
            <p>{team.squadCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Purse Total</p>
            <p>{team.purseTotal}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Purse Remaining</p>
            <p>{team.purseRemaining}</p>
          </div>
        </CardContent>
      </Card>
      {index > -1 && (
        <p className="text-xs text-muted-foreground">
          Team #{index + 1} in this tournament.
        </p>
      )}
    </div>
  );
}
