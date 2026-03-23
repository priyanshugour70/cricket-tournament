"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getErrorMessage } from "@/types";
import {
  useCreateTournamentTeam,
  useListTournamentPlayers,
  useListTournamentTeams,
  useRegisterTournamentPlayer,
  useTournamentDetails,
} from "@/hooks/use-tournaments";
import type { PlayerRole } from "@prisma/client";

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const tournamentId = params.id;

  const details = useTournamentDetails();
  const teams = useListTournamentTeams();
  const players = useListTournamentPlayers();
  const createTeam = useCreateTournamentTeam();
  const registerPlayer = useRegisterTournamentPlayer();

  const [error, setError] = useState<string | null>(null);
  const [teamCode, setTeamCode] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamPurse, setTeamPurse] = useState(1000000);

  const [playerName, setPlayerName] = useState("");
  const [playerRole, setPlayerRole] = useState<PlayerRole>("BATTER");

  useEffect(() => {
    if (!tournamentId) return;
    Promise.all([
      details.execute(tournamentId),
      teams.execute(tournamentId),
      players.execute(tournamentId),
    ]).catch((err) => setError(getErrorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentId]);

  async function onCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!tournamentId) return;
    setError(null);
    try {
      await createTeam.execute({
        tournamentId,
        payload: { code: teamCode, name: teamName, purseTotal: teamPurse },
      });
      setTeamCode("");
      setTeamName("");
      await teams.execute(tournamentId);
      await details.execute(tournamentId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function onRegisterPlayer(e: React.FormEvent) {
    e.preventDefault();
    if (!tournamentId) return;
    setError(null);
    try {
      await registerPlayer.execute({
        tournamentId,
        payload: {
          displayName: playerName,
          role: playerRole,
        },
      });
      setPlayerName("");
      await players.execute(tournamentId);
      await details.execute(tournamentId);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const tournament = details.data;

  return (
    <AppShell>
      <PageHeader
        title="Tournament Detail"
        actions={
          <Button asChild variant="outline">
            <Link href="/tournaments">Back to Tournaments</Link>
          </Button>
        }
      />

      {tournament ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>
            {tournament.name} ({tournament.code})
            </CardTitle>
          </CardHeader>
          <CardContent>
          <p className="text-sm text-muted-foreground">
            Season {tournament.season} • {tournament.format} • {tournament.status}
          </p>
          <p className="mt-2 text-sm">
            Teams: <Badge variant="secondary">{tournament.teamCount}</Badge> • Players:{" "}
            <Badge variant="secondary">{tournament.playerRegistrationCount}</Badge> • Matches:{" "}
            <Badge variant="secondary">{tournament.matchCount}</Badge>
          </p>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Tabs defaultValue="teams" className="mt-6">
        <TabsList>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
        </TabsList>
        <TabsContent value="teams" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onCreateTeam} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="teamCode">Team Code</Label>
                  <Input
                    id="teamCode"
                    placeholder="Team code"
                    value={teamCode}
                    onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="Team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamPurse">Purse Total</Label>
                  <Input
                    id="teamPurse"
                    type="number"
                    placeholder="Purse total"
                    value={teamPurse}
                    onChange={(e) => setTeamPurse(Number(e.target.value))}
                    required
                  />
                </div>
                <Button
                  className="md:col-span-3"
                  disabled={createTeam.isLoading}
                  type="submit"
                >
                  {createTeam.isLoading ? "Adding..." : "Add Team"}
                </Button>
              </form>
              <ul className="mt-4 space-y-2 text-sm">
                {(teams.data ?? []).map((team) => (
                  <li key={team.id} className="rounded-lg border border-border px-3 py-2">
                    <span className="font-medium">{team.code}</span> - {team.name} (Purse left:{" "}
                    {team.purseRemaining})
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="players" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Players</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onRegisterPlayer} className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="playerName">Player Name</Label>
                  <Input
                    id="playerName"
                    placeholder="Player display name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="playerRole">Role</Label>
                  <select
                    id="playerRole"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={playerRole}
                    onChange={(e) => setPlayerRole(e.target.value as PlayerRole)}
                  >
                    <option value="BATTER">BATTER</option>
                    <option value="BOWLER">BOWLER</option>
                    <option value="ALL_ROUNDER">ALL_ROUNDER</option>
                    <option value="WICKET_KEEPER">WICKET_KEEPER</option>
                  </select>
                </div>
                <Button
                  className="md:col-span-3"
                  disabled={registerPlayer.isLoading}
                  type="submit"
                >
                  {registerPlayer.isLoading ? "Registering..." : "Register Player"}
                </Button>
              </form>

              <ul className="mt-4 space-y-2 text-sm">
                {(players.data ?? []).map((p) => (
                  <li key={p.registrationId} className="rounded-lg border border-border px-3 py-2">
                    <span className="font-medium">{p.displayName}</span> - {p.role} ({p.status})
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

