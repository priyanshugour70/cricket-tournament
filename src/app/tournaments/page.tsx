"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layouts/app-shell";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/types";
import { useCreateTournament, useListTournaments } from "@/hooks/use-tournaments";

export default function TournamentsPage() {
  const listTournaments = useListTournaments();
  const createTournament = useCreateTournament();
  const [uiError, setUiError] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [season, setSeason] = useState(new Date().getFullYear());
  const [pursePerTeam, setPursePerTeam] = useState(1000000);

  useEffect(() => {
    listTournaments.execute(undefined).catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setUiError(null);
    try {
      await createTournament.execute({
        code,
        name,
        season,
        pursePerTeam,
      });
      setCode("");
      setName("");
      await listTournaments.execute(undefined);
    } catch (err) {
      setUiError(getErrorMessage(err));
    }
  }

  return (
    <AppShell className="max-w-5xl space-y-6">
      <PageHeader
        title="Tournaments Dashboard"
        subtitle="Manage seasons, teams, and registrations."
        actions={
          <Button asChild variant="outline">
            <Link href="/">Back to Integrations</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Create Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="e.g. IPL26"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Tournament name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="season">Season</Label>
              <Input
                id="season"
                type="number"
                placeholder="Season"
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="purse">Purse Per Team</Label>
              <Input
                id="purse"
                type="number"
                placeholder="Purse per team"
                value={pursePerTeam}
                onChange={(e) => setPursePerTeam(Number(e.target.value))}
                required
              />
            </div>
            <Button disabled={createTournament.isLoading} type="submit" className="md:col-span-2">
              {createTournament.isLoading ? "Creating..." : "Create Tournament"}
            </Button>
          </form>
          {uiError ? <p className="mt-3 text-sm text-destructive">{uiError}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Tournaments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Season</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Teams</TableHead>
                <TableHead>Players</TableHead>
                <TableHead>Matches</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(listTournaments.data ?? []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.code}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.season}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t.status}</Badge>
                  </TableCell>
                  <TableCell>{t.teamCount}</TableCell>
                  <TableCell>{t.playerRegistrationCount}</TableCell>
                  <TableCell>{t.matchCount}</TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/tournaments/${t.id}`}>Open</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

