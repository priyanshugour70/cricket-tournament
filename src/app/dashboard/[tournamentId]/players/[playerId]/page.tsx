"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, User, Edit, Save, Loader2, Award, TrendingUp,
  Globe, Star, Shield, Activity,
} from "lucide-react";
import {
  Button, Badge, Input, Label, Card, CardContent, CardHeader, CardTitle,
  Skeleton, Separator, Tabs, TabsList, TabsTrigger, TabsContent, Select,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Textarea,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import type { PlayerCareer } from "@/types/api/players";
import type { APIResponse } from "@/types";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

function formatCurrency(val: string | number | null): string {
  if (!val) return "—";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "—";
  return "₹" + num.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

type PlayerData = {
  id: string; code: string | null; firstName: string; lastName: string | null;
  displayName: string; dateOfBirth: string | null; age: number | null;
  gender: string | null; nationality: string | null; state: string | null;
  city: string | null; role: string; battingStyle: string | null;
  bowlingStyle: string | null; isOverseas: boolean; isWicketKeeper: boolean;
  isCapped: boolean; t20Matches: number; odiMatches: number; testMatches: number;
  battingRating: number; bowlingRating: number; fieldingRating: number;
  allRounderRating: number; reservePrice: string | null; basePrice: string | null;
  profilePhotoUrl: string | null; bio: string | null; email: string | null;
  phone: string | null; active: boolean; createdAt: string;
};

function RatingBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PlayerProfilePage() {
  const { tournamentId, playerId } = useParams<{ tournamentId: string; playerId: string }>();
  const { user } = useAuth();
  const isAdmin = user?.systemRole === "SUPER_ADMIN" || user?.systemRole === "ADMIN";

  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [career, setCareer] = useState<PlayerCareer | null>(null);
  const [careerLoading, setCareerLoading] = useState(true);

  const fetchPlayer = useCallback(async () => {
    try {
      const res = await fetch(`/api/players/${playerId}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        setPlayer(data.data);
        const p = data.data;
        setEditForm({
          firstName: p.firstName ?? "", lastName: p.lastName ?? "",
          displayName: p.displayName ?? "", nationality: p.nationality ?? "",
          state: p.state ?? "", city: p.city ?? "",
          email: p.email ?? "", phone: p.phone ?? "", bio: p.bio ?? "",
          role: p.role ?? "", battingStyle: p.battingStyle ?? "",
          bowlingStyle: p.bowlingStyle ?? "",
        });
      }
    } catch { /* empty */ } finally { setLoading(false); }
  }, [playerId]);

  const fetchCareer = useCallback(async () => {
    setCareerLoading(true);
    try {
      const res = await fetch(`/api/players/${playerId}/career`, { headers: authHeaders() });
      const json = (await res.json()) as APIResponse<PlayerCareer>;
      if (json.success && json.data) setCareer(json.data);
    } catch { /* empty */ } finally { setCareerLoading(false); }
  }, [playerId]);

  useEffect(() => { fetchPlayer(); }, [fetchPlayer]);
  useEffect(() => { void fetchCareer(); }, [fetchCareer]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/players/${playerId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success && data.data) { setPlayer(data.data); setEditOpen(false); }
    } catch { /* empty */ } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <User className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-medium">Player not found</p>
        <Button variant="ghost" className="mt-4" asChild>
          <Link href={`/dashboard/${tournamentId}/players`}><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/${tournamentId}/players`}><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {player.displayName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold">{player.displayName}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{player.role.replace(/_/g, " ")}</span>
                {player.nationality && <><span>·</span><span>{player.nationality}</span></>}
                {player.code && <><span>·</span><span className="font-mono">{player.code}</span></>}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {player.isCapped && <Badge variant="secondary">Capped</Badge>}
          {player.isOverseas && <Badge variant="outline">Overseas</Badge>}
          {player.isWicketKeeper && <Badge variant="secondary">WK</Badge>}
          {!player.active && <Badge variant="outline">Inactive</Badge>}
          {isAdmin && (
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Edit className="mr-1 h-3.5 w-3.5" />Edit</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                <DialogHeader><DialogTitle>Edit {player.displayName}</DialogTitle></DialogHeader>
                <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
                  {[
                    { id: "firstName", label: "First Name", required: true },
                    { id: "lastName", label: "Last Name" },
                    { id: "displayName", label: "Display Name", required: true },
                    { id: "nationality", label: "Nationality" },
                    { id: "state", label: "State" },
                    { id: "city", label: "City" },
                    { id: "email", label: "Email" },
                    { id: "phone", label: "Phone" },
                  ].map((f) => (
                    <div key={f.id} className="space-y-1.5">
                      <Label htmlFor={f.id}>{f.label}</Label>
                      <Input id={f.id} value={editForm[f.id] ?? ""} required={f.required}
                        onChange={(e) => setEditForm((p) => ({ ...p, [f.id]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select value={editForm.role} onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}>
                      <option value="BATTER">Batter</option>
                      <option value="BOWLER">Bowler</option>
                      <option value="ALL_ROUNDER">All-Rounder</option>
                      <option value="WICKET_KEEPER">Wicket Keeper</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Batting Style</Label>
                    <Select value={editForm.battingStyle} onChange={(e) => setEditForm((p) => ({ ...p, battingStyle: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="RIGHT_HAND">Right Hand</option>
                      <option value="LEFT_HAND">Left Hand</option>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bowling Style</Label>
                    <Select value={editForm.bowlingStyle} onChange={(e) => setEditForm((p) => ({ ...p, bowlingStyle: e.target.value }))}>
                      <option value="">Select</option>
                      <option value="RIGHT_ARM_FAST">Right Arm Fast</option>
                      <option value="RIGHT_ARM_MEDIUM">Right Arm Medium</option>
                      <option value="LEFT_ARM_FAST">Left Arm Fast</option>
                      <option value="LEFT_ARM_MEDIUM">Left Arm Medium</option>
                      <option value="RIGHT_ARM_OFF_SPIN">Right Arm Off Spin</option>
                      <option value="LEFT_ARM_ORTHODOX">Left Arm Orthodox</option>
                      <option value="RIGHT_ARM_LEG_SPIN">Right Arm Leg Spin</option>
                      <option value="LEFT_ARM_WRIST_SPIN">Left Arm Wrist Spin</option>
                    </Select>
                  </div>
                  <div className="col-span-full space-y-1.5">
                    <Label>Bio</Label>
                    <Textarea value={editForm.bio ?? ""} rows={3}
                      onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))} />
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

      <Tabs defaultValue="profile">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="ratings">Ratings & Stats</TabsTrigger>
          <TabsTrigger value="career">Career</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><User className="h-4 w-4" />Personal</CardTitle></CardHeader>
              <CardContent className="grid gap-2.5 text-sm">
                {[
                  ["Full Name", `${player.firstName} ${player.lastName || ""}`],
                  ["Display Name", player.displayName],
                  ["Date of Birth", player.dateOfBirth ? new Date(player.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null],
                  ["Age", player.age ? `${player.age} years` : null],
                  ["Gender", player.gender],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{(val as string) || "—"}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Globe className="h-4 w-4" />Location & Contact</CardTitle></CardHeader>
              <CardContent className="grid gap-2.5 text-sm">
                {[
                  ["Nationality", player.nationality],
                  ["State", player.state],
                  ["City", player.city],
                  ["Email", player.email],
                  ["Phone", player.phone],
                ].map(([label, val]) => (
                  <div key={label as string} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium">{(val as string) || "—"}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Shield className="h-4 w-4" />Cricket Profile</CardTitle></CardHeader>
              <CardContent className="grid gap-2.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-medium">{player.role.replace(/_/g, " ")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Batting</span><span className="font-medium">{player.battingStyle?.replace(/_/g, " ") || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bowling</span><span className="font-medium">{player.bowlingStyle?.replace(/_/g, " ") || "—"}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-muted-foreground">Base Price</span><span className="font-medium">{formatCurrency(player.basePrice)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Reserve Price</span><span className="font-medium">{formatCurrency(player.reservePrice)}</span></div>
              </CardContent>
            </Card>

            {player.bio && (
              <Card>
                <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold">Bio</CardTitle></CardHeader>
                <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{player.bio}</p></CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="ratings" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><Star className="h-4 w-4" />Player Ratings</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <RatingBar label="Batting" value={player.battingRating} />
                <RatingBar label="Bowling" value={player.bowlingRating} />
                <RatingBar label="Fielding" value={player.fieldingRating} />
                <RatingBar label="All-Rounder" value={player.allRounderRating} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="h-4 w-4" />Overall</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="text-5xl font-bold text-primary">
                  {Math.round((player.battingRating + player.bowlingRating + player.fieldingRating) / 3)}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Average Rating</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="career" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Award className="h-4 w-4" />
                International / listed experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold">{player.t20Matches}</p>
                  <p className="mt-1 text-sm text-muted-foreground">T20 Matches</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{player.odiMatches}</p>
                  <p className="mt-1 text-sm text-muted-foreground">ODI Matches</p>
                </div>
                <div>
                  <p className="text-3xl font-bold">{player.testMatches}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Test Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {careerLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : career ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Runs (off bat)", career.runsOffBat],
                  ["Balls faced", career.ballsAsBatsman],
                  ["Wickets", career.wicketsAsBowler],
                  ["4s / 6s", `${career.fours} / ${career.sixes}`],
                ].map(([label, val]) => (
                  <Card key={label as string}>
                    <CardContent className="pt-6 text-center">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums">{val}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tournament matches (squads)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {career.recentMatches.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No squad matches yet.</p>
                  ) : (
                    career.recentMatches.map((m) => (
                      <div
                        key={m.matchId}
                        className="flex flex-col gap-1 rounded-lg border border-border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <span className="font-medium">{m.homeTeamName}</span>
                          <span className="mx-1 text-muted-foreground">vs</span>
                          <span className="font-medium">{m.awayTeamName}</span>
                          <Badge variant="outline" className="ml-2 text-[10px]">
                            {m.tournamentName}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          #{m.matchNo} · {m.status.replace(/_/g, " ")}
                          {m.resultSummary ? ` · ${m.resultSummary}` : ""}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4" />
                    Recent ball involvement
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 space-y-2 overflow-y-auto">
                  {career.recentBallInvolvement.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No balls in this system yet.</p>
                  ) : (
                    career.recentBallInvolvement.map((b) => (
                      <div key={b.id} className="rounded-md bg-muted/40 px-3 py-2 text-xs">
                        <span className="font-mono text-muted-foreground">
                          {b.overNo}.{b.ballNo}
                        </span>
                        <Badge variant="secondary" className="ml-2 text-[10px]">
                          {b.involvement}
                        </Badge>
                        <span className="ml-2">
                          {b.homeTeamName} vs {b.awayTeamName}
                        </span>
                        <p className="mt-1 text-sm">
                          {b.isWicket ? "Wicket" : `${b.totalRuns} run(s)`}
                          {b.isFour && " · FOUR"}
                          {b.isSix && " · SIX"}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Career data unavailable.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
