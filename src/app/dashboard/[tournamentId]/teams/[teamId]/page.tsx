"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Shield, Edit, Users, Swords,
  MapPin, User, Phone, Mail, Palette, Save, Loader2,
} from "lucide-react";
import {
  Button, Badge, Input, Label, Card, CardContent, CardHeader, CardTitle,
  Skeleton, Separator, Tabs, TabsList, TabsTrigger, TabsContent,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function formatCurrency(val: string | number): string {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "₹0";
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

type TeamData = {
  id: string; code: string; name: string; shortName: string | null;
  status: string; city: string | null; ownerName: string | null;
  managerName: string | null; coachName: string | null; captainName: string | null;
  homeGround: string | null; logoUrl: string | null;
  primaryColor: string | null; secondaryColor: string | null;
  purseTotal: string; purseSpent: string; purseRemaining: string;
  squadCount: number; retainedCount: number;
  squadMin: number; squadMax: number; overseasMin: number; overseasMax: number;
  contactEmail: string | null; contactPhone: string | null;
  createdAt: string; updatedAt: string;
};

type SquadPlayer = {
  id: string; teamId: string; playerId: string; playerDisplayName: string;
  playerRole: string; acquisitionType: string; acquisitionAmount: string | null;
  jerseyNumber: number | null; isCaptain: boolean; isViceCaptain: boolean;
  isOverseas: boolean; isActive: boolean;
};

type MatchRow = {
  id: string; matchNo: number; homeTeamName: string; awayTeamName: string;
  homeTeamId: string; awayTeamId: string;
  status: string; scheduledAt: string | null; resultSummary: string | null;
};

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  DRAFT: "bg-gray-100 text-gray-700",
  SUSPENDED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-orange-100 text-orange-800",
};

export default function TeamDetailPage() {
  const { tournamentId, teamId } = useParams<{ tournamentId: string; teamId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.systemRole === "SUPER_ADMIN" || user?.systemRole === "ADMIN";

  const [team, setTeam] = useState<TeamData | null>(null);
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const fetchAll = useCallback(async () => {
    try {
      const [tRes, sRes, mRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/squads`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/matches`, { headers: authHeaders() }),
      ]);
      const [tData, sData, mData] = await Promise.all([tRes.json(), sRes.json(), mRes.json()]);

      if (tData.success && tData.data) {
        setTeam(tData.data);
        setEditForm({
          name: tData.data.name ?? "",
          shortName: tData.data.shortName ?? "",
          city: tData.data.city ?? "",
          homeGround: tData.data.homeGround ?? "",
          ownerName: tData.data.ownerName ?? "",
          managerName: tData.data.managerName ?? "",
          coachName: tData.data.coachName ?? "",
          captainName: tData.data.captainName ?? "",
          primaryColor: tData.data.primaryColor ?? "#1e40af",
          secondaryColor: tData.data.secondaryColor ?? "#f59e0b",
          contactEmail: tData.data.contactEmail ?? "",
          contactPhone: tData.data.contactPhone ?? "",
          logoUrl: tData.data.logoUrl ?? "",
        });
      }
      if (sData.success && Array.isArray(sData.data)) {
        setSquad(sData.data.filter((s: SquadPlayer) => s.teamId === teamId && s.isActive));
      }
      if (mData.success && Array.isArray(mData.data)) {
        setMatches(mData.data.filter((m: MatchRow) => m.homeTeamId === teamId || m.awayTeamId === teamId));
      }
    } catch { /* empty */ } finally { setLoading(false); }
  }, [tournamentId, teamId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/teams/${teamId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTeam(data.data);
        setEditOpen(false);
      }
    } catch { /* empty */ } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-medium">Team not found</p>
        <Button variant="ghost" className="mt-4" asChild>
          <Link href={`/dashboard/${tournamentId}/teams`}><ArrowLeft className="mr-1 h-4 w-4" />Back to Teams</Link>
        </Button>
      </div>
    );
  }

  const pursePercent = parseFloat(team.purseTotal) > 0
    ? ((parseFloat(team.purseSpent) / parseFloat(team.purseTotal)) * 100).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/${tournamentId}/teams`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
              style={{ backgroundColor: team.primaryColor || "#1e40af" }}>
              {team.code.slice(0, 3)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{team.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">{team.code}</span>
                {team.shortName && <><span>·</span><span>{team.shortName}</span></>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusColors[team.status] || ""}>{team.status}</Badge>
          {isAdmin && (
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Edit className="mr-1 h-3.5 w-3.5" />Edit Team</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                <DialogHeader><DialogTitle>Edit {team.name}</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
                  {[
                    { id: "name", label: "Team Name", required: true },
                    { id: "shortName", label: "Short Name" },
                    { id: "city", label: "City" },
                    { id: "homeGround", label: "Home Ground" },
                    { id: "ownerName", label: "Owner" },
                    { id: "managerName", label: "Manager" },
                    { id: "coachName", label: "Coach" },
                    { id: "captainName", label: "Captain" },
                    { id: "contactEmail", label: "Contact Email" },
                    { id: "contactPhone", label: "Contact Phone" },
                    { id: "logoUrl", label: "Logo URL" },
                  ].map((f) => (
                    <div key={f.id} className="space-y-1.5">
                      <Label htmlFor={f.id}>{f.label}</Label>
                      <Input id={f.id} value={editForm[f.id] ?? ""} required={f.required}
                        onChange={(e) => setEditForm((p) => ({ ...p, [f.id]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={editForm.primaryColor || "#1e40af"} className="h-9 w-12 cursor-pointer rounded border"
                        onChange={(e) => setEditForm((p) => ({ ...p, primaryColor: e.target.value }))} />
                      <Input value={editForm.primaryColor || ""} onChange={(e) => setEditForm((p) => ({ ...p, primaryColor: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <input type="color" value={editForm.secondaryColor || "#f59e0b"} className="h-9 w-12 cursor-pointer rounded border"
                        onChange={(e) => setEditForm((p) => ({ ...p, secondaryColor: e.target.value }))} />
                      <Input value={editForm.secondaryColor || ""} onChange={(e) => setEditForm((p) => ({ ...p, secondaryColor: e.target.value }))} />
                    </div>
                  </div>
                  <div className="col-span-full flex gap-2 pt-2">
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                      Save Changes
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>Cancel</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="squad">Squad ({squad.length})</TabsTrigger>
          <TabsTrigger value="purse">Purse & Finance</TabsTrigger>
          <TabsTrigger value="matches">Matches ({matches.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4" />Team Information</CardTitle></CardHeader>
              <CardContent className="grid gap-2.5 text-sm">
                {([
                  ["Name", team.name], ["Code", team.code], ["Short Name", team.shortName],
                  ["City", team.city], ["Home Ground", team.homeGround],
                ] as const).map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{val || "—"}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><User className="h-4 w-4" />Management</CardTitle></CardHeader>
              <CardContent className="grid gap-2.5 text-sm">
                {([
                  ["Owner", team.ownerName], ["Manager", team.managerName],
                  ["Coach", team.coachName], ["Captain", team.captainName],
                ] as const).map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{val || "—"}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Palette className="h-4 w-4" />Branding</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: team.primaryColor || "#ccc" }} />
                  <span className="text-sm">Primary: {team.primaryColor || "Not set"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full border" style={{ backgroundColor: team.secondaryColor || "#ccc" }} />
                  <span className="text-sm">Secondary: {team.secondaryColor || "Not set"}</span>
                </div>
                {team.logoUrl && (
                  <div className="text-xs text-muted-foreground break-all">Logo: {team.logoUrl}</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Phone className="h-4 w-4" />Contact & Config</CardTitle></CardHeader>
              <CardContent className="grid gap-2.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{team.contactEmail || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{team.contactPhone || "—"}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">Squad Size</span><span className="font-medium">{team.squadMin}–{team.squadMax}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Overseas Limit</span><span className="font-medium">{team.overseasMin}–{team.overseasMax}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Retained</span><span className="font-medium">{team.retainedCount}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="squad" className="mt-4">
          {squad.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center py-12 text-center">
              <Users className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium">No squad players yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Players will appear here after the auction or draft.</p>
            </CardContent></Card>
          ) : (
            <Card><Table>
              <TableHeader><TableRow>
                <TableHead>#</TableHead><TableHead>Player</TableHead><TableHead>Role</TableHead>
                <TableHead>Type</TableHead><TableHead>Price</TableHead><TableHead>Flags</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {squad.map((p, i) => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/${tournamentId}/players/${p.playerId}`)}>
                    <TableCell className="font-mono text-xs">{p.jerseyNumber ?? i + 1}</TableCell>
                    <TableCell className="font-medium">{p.playerDisplayName}</TableCell>
                    <TableCell className="text-sm">{p.playerRole.replace(/_/g, " ")}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.acquisitionType}</Badge></TableCell>
                    <TableCell className="text-sm">{p.acquisitionAmount ? formatCurrency(p.acquisitionAmount) : "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {p.isCaptain && <Badge variant="secondary" className="text-[10px]">C</Badge>}
                        {p.isViceCaptain && <Badge variant="secondary" className="text-[10px]">VC</Badge>}
                        {p.isOverseas && <Badge variant="outline" className="text-[10px]">OS</Badge>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></Card>
          )}
        </TabsContent>

        <TabsContent value="purse" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Total Purse</p>
              <p className="mt-1 text-2xl font-bold">{formatCurrency(team.purseTotal)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="mt-1 text-2xl font-bold text-red-600">{formatCurrency(team.purseSpent)}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(team.purseRemaining)}</p>
            </CardContent></Card>
          </div>
          <Card><CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget Utilization</span>
              <span className="font-semibold">{pursePercent}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(parseFloat(pursePercent), 100)}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Squad Size</span><span className="font-medium">{squad.length} / {team.squadMax}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Overseas</span><span className="font-medium">{squad.filter(s => s.isOverseas).length} / {team.overseasMax}</span></div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="matches" className="mt-4">
          {matches.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center py-12 text-center">
              <Swords className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium">No matches scheduled</p>
            </CardContent></Card>
          ) : (
            <Card><Table>
              <TableHeader><TableRow>
                <TableHead>#</TableHead><TableHead>Match</TableHead><TableHead>Date</TableHead>
                <TableHead>Status</TableHead><TableHead>Result</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {matches.map((m) => (
                  <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/dashboard/${tournamentId}/matches/${m.id}`)}>
                    <TableCell className="font-mono text-xs">{m.matchNo}</TableCell>
                    <TableCell>
                      <span className={m.homeTeamId === teamId ? "font-bold" : ""}>{m.homeTeamName}</span>
                      <span className="mx-1.5 text-muted-foreground">vs</span>
                      <span className={m.awayTeamId === teamId ? "font-bold" : ""}>{m.awayTeamName}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.scheduledAt ? new Date(m.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "TBD"}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{m.status.replace(/_/g, " ")}</Badge></TableCell>
                    <TableCell className="max-w-[150px] truncate text-xs">{m.resultSummary || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
