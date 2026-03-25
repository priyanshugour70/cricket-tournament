"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Loader2, Zap, Users, ClipboardList, Target,
} from "lucide-react";
import {
  Button, Badge, Input, Label, Card, CardContent, CardHeader, CardTitle,
  Select, Skeleton, Separator, Tabs, TabsList, TabsTrigger, TabsContent, Textarea,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  TOSS_PENDING: "bg-yellow-100 text-yellow-800",
  LIVE: "bg-red-100 text-red-800 animate-pulse",
  INNINGS_BREAK: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-stone-200 text-stone-700",
  ABANDONED: "bg-gray-100 text-gray-600",
  NO_RESULT: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-gray-100 text-gray-600",
};

type MatchData = {
  id: string; matchNo: number; status: string; stage: string;
  homeTeamId: string; homeTeamName: string; homeTeamCode: string;
  awayTeamId: string; awayTeamName: string; awayTeamCode: string;
  venueName: string | null; city: string | null;
  scheduledAt: string | null; startedAt: string | null; completedAt: string | null;
  tossWonByTeamId: string | null; tossDecision: string | null;
  winningTeamId: string | null; resultType: string | null; resultSummary: string | null;
  winMarginRuns: number | null; winMarginWickets: number | null;
  oversPerSide: string; umpire1: string | null; umpire2: string | null;
  thirdUmpire: string | null; referee: string | null;
};

type InningsData = {
  id: string; inningsNo: number; battingTeamId: string; battingTeamName: string;
  bowlingTeamId: string; bowlingTeamName: string; status: string;
  totalRuns: number; totalWickets: number; totalOvers: string; extras: number;
  runRate: string; targetScore: number | null;
};

type BallData = {
  id: string; overNo: number; ballNo: number; runs: number; totalRuns: number;
  batsmanId: string; bowlerId: string; isExtra: boolean; extraType: string | null;
  isWicket: boolean; dismissalType: string | null; isFour: boolean; isSix: boolean;
};

type CommentaryData = {
  id: string; overNo: number; ballNo: number | null; text: string;
  isHighlight: boolean; createdAt: string;
};

type PlayingXIPlayer = {
  id: string; playerId: string; playerName: string; teamId: string;
  slotNo: number; role: string | null; isCaptain: boolean;
  isViceCaptain: boolean; isWicketKeeper: boolean;
};

type SquadPlayer = {
  id: string; playerId: string; teamId: string;
  playerDisplayName: string; playerRole: string;
  isCaptain: boolean; isViceCaptain: boolean; isOverseas: boolean;
};

export default function MatchDetailPage() {
  const { tournamentId, matchId } = useParams<{ tournamentId: string; matchId: string }>();
  const { user } = useAuth();
  const isAdmin = user?.systemRole === "SUPER_ADMIN" || user?.systemRole === "ADMIN";

  const [match, setMatch] = useState<MatchData | null>(null);
  const [innings, setInnings] = useState<InningsData[]>([]);
  const [xi, setXI] = useState<PlayingXIPlayer[]>([]);
  const [squad, setSquad] = useState<SquadPlayer[]>([]);
  const [balls, setBalls] = useState<BallData[]>([]);
  const [commentary, setCommentary] = useState<CommentaryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeInnings, setActiveInnings] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [tossForm, setTossForm] = useState({ tossWonByTeamId: "", tossDecision: "" });
  const [statusForm, setStatusForm] = useState("");
  const [resultForm, setResultForm] = useState({
    winningTeamId: "", resultSummary: "", resultType: "TEAM_WIN",
    winMarginRuns: "", winMarginWickets: "",
  });
  const [scoreForm, setScoreForm] = useState({ batsmanId: "", bowlerId: "", nonStrikerId: "" });
  const [commentaryText, setCommentaryText] = useState("");
  const [ballCommentaryNote, setBallCommentaryNote] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [mRes, iRes, xiRes, sRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, { headers: authHeaders() }),
        fetch(`/api/matches/${matchId}/innings`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/matches/${matchId}/playing-xi`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/squads`, { headers: authHeaders() }),
      ]);
      const [mData, iData, xiData, sData] = await Promise.all([
        mRes.json(), iRes.json(), xiRes.json(), sRes.json(),
      ]);

      if (mData.success && mData.data) {
        const d = mData.data;
        setMatch(d);
        setTossForm({ tossWonByTeamId: d.tossWonByTeamId || "", tossDecision: d.tossDecision || "" });
        setStatusForm(d.status);
        setResultForm({
          winningTeamId: d.winningTeamId || "",
          resultSummary: d.resultSummary || "",
          resultType: d.resultType || "TEAM_WIN",
          winMarginRuns: d.winMarginRuns?.toString() || "",
          winMarginWickets: d.winMarginWickets?.toString() || "",
        });
      }
      if (iData.success && Array.isArray(iData.data)) {
        setInnings(iData.data);
        const live = iData.data.find((i: InningsData) => i.status === "IN_PROGRESS")
          || iData.data[iData.data.length - 1];
        if (live) setActiveInnings(live.id);
      }
      if (xiData.success && Array.isArray(xiData.data)) setXI(xiData.data);
      if (sData.success && Array.isArray(sData.data)) setSquad(sData.data);
    } catch {
      /* network error */
    } finally {
      setLoading(false);
    }
  }, [tournamentId, matchId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (!activeInnings) return;
    let cancelled = false;
    async function loadBalls() {
      try {
        const [bRes, cRes] = await Promise.all([
          fetch(`/api/matches/${matchId}/innings/${activeInnings}/balls`, { headers: authHeaders() }),
          fetch(`/api/matches/${matchId}/innings/${activeInnings}/commentary`, { headers: authHeaders() }),
        ]);
        const [bData, cData] = await Promise.all([bRes.json(), cRes.json()]);
        if (cancelled) return;
        if (bData.success) setBalls(bData.data ?? []);
        if (cData.success) setCommentary(cData.data ?? []);
      } catch {
        /* network error */
      }
    }
    loadBalls();
    return () => { cancelled = true; };
  }, [activeInnings, matchId]);

  async function patchMatch(data: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/matches/${matchId}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(data),
      });
      const r = await res.json();
      if (r.success && r.data) setMatch(r.data);
    } catch {
      /* network error */
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateInnings() {
    if (!match) return;
    const inningsNo = innings.length + 1;
    let battingTeamId = inningsNo === 1 ? match.homeTeamId : match.awayTeamId;
    let bowlingTeamId = inningsNo === 1 ? match.awayTeamId : match.homeTeamId;

    if (match.tossWonByTeamId && match.tossDecision) {
      const tossWinner = match.tossWonByTeamId;
      const tossLoser = tossWinner === match.homeTeamId ? match.awayTeamId : match.homeTeamId;
      if (inningsNo === 1) {
        battingTeamId = match.tossDecision === "BAT" ? tossWinner : tossLoser;
        bowlingTeamId = match.tossDecision === "BAT" ? tossLoser : tossWinner;
      } else {
        battingTeamId = match.tossDecision === "BAT" ? tossLoser : tossWinner;
        bowlingTeamId = match.tossDecision === "BAT" ? tossWinner : tossLoser;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/innings`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ inningsNo, battingTeamId, bowlingTeamId }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setInnings(prev => [...prev, data.data]);
        setActiveInnings(data.data.id);
      }
    } catch {
      /* network error */
    } finally {
      setSaving(false);
    }
  }

  async function addBall(
    runs: number,
    extras?: { isExtra: boolean; extraType: string; extraRuns: number },
  ) {
    if (!activeInnings || !scoreForm.batsmanId || !scoreForm.bowlerId) return;
    const lastBall = balls[balls.length - 1];
    let overNo = lastBall ? lastBall.overNo : 1;
    let ballNo = lastBall ? lastBall.ballNo + 1 : 1;
    if (ballNo > 6 && !extras?.isExtra) { overNo++; ballNo = 1; }

    setSaving(true);
    try {
      const note = ballCommentaryNote.trim();
      const res = await fetch(`/api/matches/${matchId}/innings/${activeInnings}/balls`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          overNo, ballNo,
          batsmanId: scoreForm.batsmanId,
          bowlerId: scoreForm.bowlerId,
          nonStrikerId: scoreForm.nonStrikerId || undefined,
          runs,
          isFour: runs === 4,
          isSix: runs === 6,
          isDot: runs === 0 && !extras,
          ...(extras || {}),
          ...(note ? { commentaryNote: note } : {}),
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setBalls(prev => [...prev, data.data]);
        setBallCommentaryNote("");
        const iRes = await fetch(`/api/matches/${matchId}/innings`, { headers: authHeaders() });
        const iData = await iRes.json();
        if (iData.success) setInnings(iData.data);
        const cRes = await fetch(`/api/matches/${matchId}/innings/${activeInnings}/commentary`, { headers: authHeaders() });
        const cData = await cRes.json();
        if (cData.success) setCommentary(cData.data ?? []);
      }
    } catch {
      /* network error */
    } finally {
      setSaving(false);
    }
  }

  async function handleAddCommentary(e: FormEvent) {
    e.preventDefault();
    if (!activeInnings || !commentaryText.trim()) return;
    const lastBall = balls[balls.length - 1];
    setSaving(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/innings/${activeInnings}/commentary`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          overNo: lastBall?.overNo ?? 1,
          ballNo: lastBall?.ballNo ?? null,
          text: commentaryText,
          isHighlight: false,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setCommentary(prev => [data.data, ...prev]);
        setCommentaryText("");
      }
    } catch {
      /* network error */
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-6 w-96" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-lg font-medium text-muted-foreground">Match not found</p>
      </div>
    );
  }

  const homeXI = xi.filter(p => p.teamId === match.homeTeamId);
  const awayXI = xi.filter(p => p.teamId === match.awayTeamId);
  const homeSquad = squad.filter(s => s.teamId === match.homeTeamId);
  const awaySquad = squad.filter(s => s.teamId === match.awayTeamId);
  const currentInnings = innings.find(i => i.id === activeInnings);

  const xiPlayers = [...homeXI, ...awayXI];
  const battingPlayers = currentInnings
    ? xiPlayers.filter(p => p.teamId === currentInnings.battingTeamId)
    : [];
  const bowlingPlayers = currentInnings
    ? xiPlayers.filter(p => p.teamId === currentInnings.bowlingTeamId)
    : [];

  const tossTeamName = match.tossWonByTeamId
    ? match.tossWonByTeamId === match.homeTeamId ? match.homeTeamName : match.awayTeamName
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/${tournamentId}/matches`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Match #{match.matchNo}</h1>
            <Badge className={statusColors[match.status] || ""}>
              {match.status.replace(/_/g, " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold">{match.homeTeamCode}</span>
            <span className="mx-2">vs</span>
            <span className="font-semibold">{match.awayTeamCode}</span>
            {match.venueName && <span className="ml-2">· {match.venueName}</span>}
            {match.scheduledAt && (
              <span className="ml-2">
                · {new Date(match.scheduledAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>
      </div>

      {innings.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {innings.map(inn => (
            <Card
              key={inn.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${inn.id === activeInnings ? "ring-2 ring-primary" : ""}`}
              onClick={() => setActiveInnings(inn.id)}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-semibold">
                    {inn.battingTeamName} — Innings {inn.inningsNo}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    {inn.totalRuns}/{inn.totalWickets}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">
                      ({inn.totalOvers} ov)
                    </span>
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">RR: {inn.runRate}</p>
                  {inn.targetScore != null && (
                    <p className="text-muted-foreground">Target: {inn.targetScore}</p>
                  )}
                  <Badge variant="outline" className="mt-1 text-xs">
                    {inn.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue={match.status === "LIVE" ? "live" : "info"}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="info">
            <ClipboardList className="mr-1 h-3.5 w-3.5" />Info
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="toss">
              <Target className="mr-1 h-3.5 w-3.5" />Toss & Status
            </TabsTrigger>
          )}
          <TabsTrigger value="xi">
            <Users className="mr-1 h-3.5 w-3.5" />Playing XI
          </TabsTrigger>
          <TabsTrigger value="live">
            <Zap className="mr-1 h-3.5 w-3.5" />Live & feed
          </TabsTrigger>
        </TabsList>

        {/* ── Info Tab ── */}
        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="grid gap-3 pt-6 text-sm sm:grid-cols-2">
              {([
                ["Stage", match.stage.replace(/_/g, " ")],
                ["Overs", match.oversPerSide],
                ["Venue", match.venueName || "—"],
                ["City", match.city || "—"],
                ["Umpire 1", match.umpire1 || "—"],
                ["Umpire 2", match.umpire2 || "—"],
                ["Third Umpire", match.thirdUmpire || "—"],
                ["Referee", match.referee || "—"],
                ["Toss", tossTeamName ? `${tossTeamName} elected to ${match.tossDecision}` : "Not decided"],
                ["Result", match.resultSummary || "—"],
              ] as const).map(([label, val]) => (
                <div key={label} className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{val}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Toss & Status Tab (admin only) ── */}
        {isAdmin && (
          <TabsContent value="toss" className="mt-4 space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Toss</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Won By</Label>
                  <Select
                    value={tossForm.tossWonByTeamId}
                    onChange={e => setTossForm(p => ({ ...p, tossWonByTeamId: e.target.value }))}
                  >
                    <option value="">Select team</option>
                    <option value={match.homeTeamId}>{match.homeTeamName}</option>
                    <option value={match.awayTeamId}>{match.awayTeamName}</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Decision</Label>
                  <Select
                    value={tossForm.tossDecision}
                    onChange={e => setTossForm(p => ({ ...p, tossDecision: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value="BAT">Bat First</option>
                    <option value="BOWL">Bowl First</option>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button size="sm" disabled={saving} onClick={() => patchMatch(tossForm)}>
                    {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    Save Toss
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Match Status</CardTitle></CardHeader>
              <CardContent className="flex gap-3">
                <Select
                  value={statusForm}
                  onChange={e => setStatusForm(e.target.value)}
                  className="max-w-xs"
                >
                  {["SCHEDULED", "TOSS_PENDING", "LIVE", "INNINGS_BREAK", "COMPLETED", "ABANDONED", "NO_RESULT", "CANCELLED"].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </Select>
                <Button size="sm" disabled={saving} onClick={() => patchMatch({ status: statusForm })}>
                  {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                  Update Status
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Result</CardTitle></CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Winner</Label>
                  <Select
                    value={resultForm.winningTeamId}
                    onChange={e => setResultForm(p => ({ ...p, winningTeamId: e.target.value }))}
                  >
                    <option value="">Select</option>
                    <option value={match.homeTeamId}>{match.homeTeamName}</option>
                    <option value={match.awayTeamId}>{match.awayTeamName}</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Result Summary</Label>
                  <Input
                    value={resultForm.resultSummary}
                    placeholder="e.g. MI won by 5 wickets"
                    onChange={e => setResultForm(p => ({ ...p, resultSummary: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Win Margin (Runs)</Label>
                  <Input
                    type="number"
                    value={resultForm.winMarginRuns}
                    onChange={e => setResultForm(p => ({ ...p, winMarginRuns: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Win Margin (Wickets)</Label>
                  <Input
                    type="number"
                    value={resultForm.winMarginWickets}
                    onChange={e => setResultForm(p => ({ ...p, winMarginWickets: e.target.value }))}
                  />
                </div>
                <div className="col-span-full">
                  <Button
                    size="sm"
                    disabled={saving}
                    onClick={() => patchMatch({
                      ...resultForm,
                      status: "COMPLETED",
                      winMarginRuns: resultForm.winMarginRuns ? parseInt(resultForm.winMarginRuns) : undefined,
                      winMarginWickets: resultForm.winMarginWickets ? parseInt(resultForm.winMarginWickets) : undefined,
                    })}
                  >
                    {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                    Save Result
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* ── Playing XI Tab ── */}
        <TabsContent value="xi" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {([
              { label: match.homeTeamName, teamId: match.homeTeamId, players: homeXI, squadList: homeSquad },
              { label: match.awayTeamName, teamId: match.awayTeamId, players: awayXI, squadList: awaySquad },
            ] as const).map(({ label, teamId, players, squadList }) => (
              <Card key={teamId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{label} ({players.length}/11)</CardTitle>
                </CardHeader>
                <CardContent>
                  {players.length > 0 ? (
                    <div className="space-y-1.5">
                      {players.map(p => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-1.5 text-sm"
                        >
                          <span className="font-medium">{p.playerName}</span>
                          <div className="flex gap-1">
                            {p.isCaptain && <Badge variant="secondary" className="text-[10px]">C</Badge>}
                            {p.isViceCaptain && <Badge variant="secondary" className="text-[10px]">VC</Badge>}
                            {p.isWicketKeeper && <Badge variant="outline" className="text-[10px]">WK</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-sm text-muted-foreground">
                      {squadList.length > 0 ? "Playing XI not set yet" : "No squad players available"}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Live: scoring + commentary feed ── */}
        <TabsContent value="live" className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Label>Active Innings</Label>
            <Select
              value={activeInnings}
              onChange={e => setActiveInnings(e.target.value)}
              className="max-w-xs"
            >
              {innings.map(i => (
                <option key={i.id} value={i.id}>
                  Innings {i.inningsNo} — {i.battingTeamName} ({i.totalRuns}/{i.totalWickets})
                </option>
              ))}
            </Select>
            {isAdmin && innings.length < 2 && (
              <Button size="sm" variant="outline" disabled={saving} onClick={handleCreateInnings}>
                {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                New Innings
              </Button>
            )}
          </div>

          {currentInnings && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Live Score: {currentInnings.battingTeamName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-4xl font-bold tabular-nums">
                    {currentInnings.totalRuns}/{currentInnings.totalWickets}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Overs: {currentInnings.totalOvers} · RR: {currentInnings.runRate}
                  </p>
                  {currentInnings.targetScore != null && (
                    <p className="text-sm font-medium text-muted-foreground">
                      Target: {currentInnings.targetScore}
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <>
                    <Separator />
                    <div className="space-y-1.5 sm:col-span-3">
                      <Label htmlFor="ballNote">Extra detail on next ball (optional)</Label>
                      <Textarea
                        id="ballNote"
                        rows={2}
                        className="resize-none text-sm"
                        placeholder="e.g. Slower ball, top edge, dropped at long-on…"
                        value={ballCommentaryNote}
                        onChange={e => setBallCommentaryNote(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Each scored ball auto-posts commentary; this text is appended to that line.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label>Striker</Label>
                        <Select
                          value={scoreForm.batsmanId}
                          onChange={e => setScoreForm(p => ({ ...p, batsmanId: e.target.value }))}
                        >
                          <option value="">Select batsman</option>
                          {battingPlayers.map(p => (
                            <option key={p.playerId} value={p.playerId}>{p.playerName}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Non-Striker</Label>
                        <Select
                          value={scoreForm.nonStrikerId}
                          onChange={e => setScoreForm(p => ({ ...p, nonStrikerId: e.target.value }))}
                        >
                          <option value="">Select</option>
                          {battingPlayers.map(p => (
                            <option key={p.playerId} value={p.playerId}>{p.playerName}</option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Bowler</Label>
                        <Select
                          value={scoreForm.bowlerId}
                          onChange={e => setScoreForm(p => ({ ...p, bowlerId: e.target.value }))}
                        >
                          <option value="">Select bowler</option>
                          {bowlingPlayers.map(p => (
                            <option key={p.playerId} value={p.playerId}>{p.playerName}</option>
                          ))}
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[0, 1, 2, 3, 4, 6].map(r => (
                        <Button
                          key={r}
                          size="lg"
                          variant={r === 4 || r === 6 ? "default" : "outline"}
                          className="h-12 w-12 text-lg font-bold"
                          disabled={saving || !scoreForm.batsmanId || !scoreForm.bowlerId}
                          onClick={() => addBall(r)}
                        >
                          {r}
                        </Button>
                      ))}
                      <Button
                        size="lg"
                        variant="destructive"
                        className="h-12 px-4"
                        disabled={saving || !scoreForm.batsmanId || !scoreForm.bowlerId}
                        onClick={() => addBall(0, { isExtra: true, extraType: "WIDE", extraRuns: 1 })}
                      >
                        WD
                      </Button>
                      <Button
                        size="lg"
                        variant="destructive"
                        className="h-12 px-4"
                        disabled={saving || !scoreForm.batsmanId || !scoreForm.bowlerId}
                        onClick={() => addBall(0, { isExtra: true, extraType: "NO_BALL", extraRuns: 1 })}
                      >
                        NB
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="h-12 px-4"
                        disabled={saving || !scoreForm.batsmanId || !scoreForm.bowlerId}
                        onClick={() => addBall(0, { isExtra: true, extraType: "BYE", extraRuns: 1 })}
                      >
                        BYE
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="h-12 px-4"
                        disabled={saving || !scoreForm.batsmanId || !scoreForm.bowlerId}
                        onClick={() => addBall(0, { isExtra: true, extraType: "LEG_BYE", extraRuns: 1 })}
                      >
                        LB
                      </Button>
                    </div>
                  </>
                )}

                <Separator />
                <div>
                  <p className="mb-2 text-sm font-semibold">This Over</p>
                  <div className="flex flex-wrap gap-1.5">
                    {balls.length === 0 && (
                      <p className="text-sm text-muted-foreground">No balls bowled yet</p>
                    )}
                    {balls.slice(-6).map(b => (
                      <div
                        key={b.id}
                        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                          b.isWicket ? "bg-red-500 text-white" :
                          b.isSix ? "bg-green-500 text-white" :
                          b.isFour ? "bg-blue-500 text-white" :
                          b.isExtra ? "bg-yellow-100 text-yellow-800" :
                          b.totalRuns === 0 ? "bg-gray-200 text-gray-600" :
                          "bg-primary/10 text-primary"
                        }`}
                      >
                        {b.isWicket ? "W" : b.isExtra ? (b.extraType?.slice(0, 2) || "E") : b.totalRuns}
                      </div>
                    ))}
                  </div>
                </div>

                {balls.length > 6 && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 text-sm font-semibold">Ball Log</p>
                      <div className="max-h-48 overflow-y-auto">
                        <div className="space-y-1">
                          {[...balls].reverse().map(b => (
                            <div
                              key={b.id}
                              className="flex items-center justify-between rounded bg-muted/40 px-3 py-1 text-xs"
                            >
                              <span className="tabular-nums text-muted-foreground">
                                {b.overNo}.{b.ballNo}
                              </span>
                              <span className="font-medium">
                                {b.isWicket ? "WICKET" : b.isExtra ? `${b.extraType} +${b.totalRuns}` : `${b.totalRuns} run${b.totalRuns !== 1 ? "s" : ""}`}
                              </span>
                              <span>
                                {b.isFour && <Badge variant="secondary" className="text-[10px]">4</Badge>}
                                {b.isSix && <Badge className="text-[10px]">6</Badge>}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Separator />
                <div>
                  <p className="mb-2 text-sm font-semibold">Commentary feed</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Updates when balls are scored; add a manual line below if needed.
                  </p>
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
                    {commentary.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">No feed yet</p>
                    ) : (
                      commentary.map(c => (
                        <div
                          key={c.id}
                          className={`flex gap-3 rounded-md px-2 py-2 text-sm ${c.isHighlight ? "bg-primary/10" : ""}`}
                        >
                          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                            {c.overNo}.{c.ballNo ?? "—"}
                          </span>
                          <span className="min-w-0 leading-snug">{c.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <>
                    <Separator />
                    <form onSubmit={handleAddCommentary} className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        className="flex-1"
                        placeholder="Manual commentary line…"
                        value={commentaryText}
                        onChange={e => setCommentaryText(e.target.value)}
                      />
                      <Button type="submit" size="sm" disabled={saving || !activeInnings}>
                        {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                        Add line
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {!currentInnings && innings.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No innings created yet. {isAdmin ? "Click \"New Innings\" to start." : "Waiting for match to begin."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
