"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui";
import type { PlayerDetail } from "@/types/api/players";
import type { APIResponse } from "@/types";

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export default function PlayerProfilePage() {
  const { tournamentId, playerId } = useParams<{
    tournamentId: string;
    playerId: string;
  }>();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);

  useEffect(() => {
    async function run() {
      const res = await fetch(`/api/players/${playerId}`, { headers: authHeaders() });
      const json = (await res.json()) as APIResponse<PlayerDetail>;
      if (json.success && json.data) setPlayer(json.data);
    }
    void run();
  }, [playerId]);

  if (!player) {
    return <div className="p-6 text-sm text-muted-foreground">Loading player profile...</div>;
  }

  return (
    <div className="space-y-4 p-2">
      <Button variant="ghost" asChild>
        <Link href={`/dashboard/${tournamentId}/players`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Players
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {player.displayName}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Role</p>
            <p>{player.role.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nationality</p>
            <p>{player.nationality ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Batting style</p>
            <p>{player.battingStyle?.replace(/_/g, " ") ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Bowling style</p>
            <p>{player.bowlingStyle?.replace(/_/g, " ") ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Matches</p>
            <p>
              T20 {player.t20Matches} · ODI {player.odiMatches} · Test {player.testMatches}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Contact</p>
            <p>{player.email ?? "—"}</p>
          </div>
          <div className="md:col-span-2 flex gap-2">
            {player.isOverseas && <Badge variant="outline">Overseas</Badge>}
            {player.isWicketKeeper && <Badge variant="secondary">Wicketkeeper</Badge>}
            {player.isCapped && <Badge variant="secondary">Capped</Badge>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
