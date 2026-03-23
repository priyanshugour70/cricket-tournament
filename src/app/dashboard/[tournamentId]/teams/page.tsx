"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { use } from "react";
import { Plus, Loader2, Users } from "lucide-react";
import {
  Button,
  Badge,
  Input,
  Label,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

type Team = {
  id: string;
  name: string;
  code: string;
  shortName?: string;
  ownerName?: string;
  city?: string;
  status: string;
  purseRemaining?: number;
  _count?: { squadMembers: number };
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
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

export default function TeamsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: "",
    code: "",
    ownerName: "",
    city: "",
  });

  const fetchTeams = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) setTeams(data.data ?? []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  async function handleAddTeam(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(teamForm),
      });
      const data = await res.json();
      if (data.success) {
        setTeamForm({ name: "", code: "", ownerName: "", city: "" });
        setShowForm(false);
        fetchTeams();
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
        <h1 className="text-xl font-semibold">Teams ({teams.length})</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add Team
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <form
              onSubmit={handleAddTeam}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  placeholder="Mumbai Indians"
                  value={teamForm.name}
                  onChange={(e) =>
                    setTeamForm((p) => ({ ...p, name: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamCode">Code</Label>
                <Input
                  id="teamCode"
                  placeholder="MI"
                  value={teamForm.code}
                  onChange={(e) =>
                    setTeamForm((p) => ({ ...p, code: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner</Label>
                <Input
                  id="ownerName"
                  placeholder="Owner name"
                  value={teamForm.ownerName}
                  onChange={(e) =>
                    setTeamForm((p) => ({ ...p, ownerName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamCity">City</Label>
                <Input
                  id="teamCity"
                  placeholder="Mumbai"
                  value={teamForm.city}
                  onChange={(e) =>
                    setTeamForm((p) => ({ ...p, city: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-full flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Team
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

      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No teams yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first team to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Purse</TableHead>
                <TableHead className="text-right">Squad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {team.code}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {team.city ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor[team.status] ?? ""}>
                      {team.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {team.purseRemaining != null
                      ? `${(team.purseRemaining / 100).toFixed(2)} Cr`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {team._count?.squadMembers ?? "—"}
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
