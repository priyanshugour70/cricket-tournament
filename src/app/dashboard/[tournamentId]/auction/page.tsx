"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { use } from "react";
import { Gavel, Plus, Loader2, Users, ChevronDown, ChevronRight, DollarSign, Check } from "lucide-react";
import {
  Button, Badge, Input, Label, Select, Card, CardHeader, CardTitle, CardContent,
  Skeleton, Separator, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Dialog, DialogContent, DialogHeader, DialogTitle,
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

type AuctionSeries = {
  id: string; name: string; status: string; sequenceNo: number;
  roundCount: number; totalPlayersSold: number; totalAmountSpent: string;
};

type AuctionRound = {
  id: string; roundNo: number; name: string; type: string;
  maxPlayers: number | null; playersSold: number; amountSpent: string;
  activePlayerId: string | null;
  activeAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  nominees: { playerId: string; basePrice: string }[];
};

type Team = { id: string; name: string; code: string; purseRemaining: string };
type Player = { id: string; displayName: string; role: string; basePrice: string | null };
type Bid = {
  id: string; teamId: string; playerId: string; bidAmount: string;
  isWinningBid: boolean; bidAt: string;
  auctionRoundId: string | null;
  placedByDisplayName?: string | null;
};

type AuctionSale = {
  id: string;
  auctionSeriesId: string;
  playerName: string;
  teamName: string;
  teamCode: string | null;
  soldPrice: string;
  soldAt: string;
  seriesName: string;
  roundName: string;
  roundType: string;
  winningBidAt: string;
  finalizedByDisplayName: string | null;
};

const statusColors: Record<string, string> = {
  PLANNED: "bg-gray-100 text-gray-700",
  LIVE: "bg-red-100 text-red-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  CLOSED: "bg-green-100 text-green-800",
};

export default function AuctionPage({ params }: { params: Promise<{ tournamentId: string }> }) {
  const { tournamentId } = use(params);
  const { user } = useAuth();
  const isAdmin = user?.systemRole === "SUPER_ADMIN" || user?.systemRole === "ADMIN";

  const [series, setSeries] = useState<AuctionSeries[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [seriesName, setSeriesName] = useState("");

  const [expandedSeries, setExpandedSeries] = useState<string>("");
  const [rounds, setRounds] = useState<AuctionRound[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [sales, setSales] = useState<AuctionSale[]>([]);

  const [showRoundForm, setShowRoundForm] = useState(false);
  const [roundForm, setRoundForm] = useState({ name: "", type: "MARQUEE" });
  const [roundNomineePick, setRoundNomineePick] = useState<string>("");
  const [roundNominees, setRoundNominees] = useState<string[]>([]);

  const [showBidDialog, setShowBidDialog] = useState(false);
  const [bidForm, setBidForm] = useState({ teamId: "", playerId: "", auctionRoundId: "", bidAmount: "" });
  const [showStartPlayerDialog, setShowStartPlayerDialog] = useState(false);
  const [startPlayerId, setStartPlayerId] = useState<string>("");

  const [showSellDialog, setShowSellDialog] = useState(false);
  const [sellForm, setSellForm] = useState({ bidId: "" });

  const [activeRoundId, setActiveRoundId] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      const [sRes, tRes, pRes, saleRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/auction/series`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/teams`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/players`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/auction/sales`, { headers: authHeaders() }),
      ]);
      const [sData, tData, pData, saleData] = await Promise.all([sRes.json(), tRes.json(), pRes.json(), saleRes.json()]);
      if (sData.success) setSeries(sData.data ?? []);
      if (tData.success) setTeams(tData.data ?? []);
      if (saleData.success) setSales(saleData.data ?? []);
      if (pData.success) {
        setPlayers((pData.data ?? []).map((r: Record<string, unknown>) => ({
          id: String(r.playerId ?? r.id ?? ""),
          displayName: String(r.displayName ?? ""),
          role: String(r.role ?? ""),
          basePrice: r.basePrice ? String(r.basePrice) : null,
        })));
      }
    } catch { setActionError("Failed to load auction data"); } finally { setLoading(false); }
  }, [tournamentId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    if (rounds.length > 0 && !activeRoundId) {
      setActiveRoundId(rounds[0]!.id);
    }
  }, [rounds, activeRoundId]);

  async function loadSeriesDetail(seriesId: string, opts?: { toggle?: boolean }) {
    const toggle = opts?.toggle ?? true;
    if (toggle && expandedSeries === seriesId) {
      setExpandedSeries("");
      return;
    }
    setExpandedSeries(seriesId);
    try {
      const [rRes, bRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/auction/series/${seriesId}/rounds`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/auction/bids?auctionSeriesId=${seriesId}`, { headers: authHeaders() }),
      ]);
      const [rData, bData] = await Promise.all([rRes.json(), bRes.json()]);
      if (rData.success) setRounds(rData.data ?? []);
      if (bData.success) setBids(bData.data ?? []);
    } catch { /* empty */ }
  }

  async function handleCreateSeries(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/auction/series`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ name: seriesName, sequenceNo: (series.at(-1)?.sequenceNo ?? 0) + 1 }),
      });
      const data = await res.json();
      if (data.success) { setSeriesName(""); setShowSeriesForm(false); fetchData(); }
      else { setActionError(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to create series"); }
    } catch { setActionError("Network error — could not create series"); } finally { setSaving(false); }
  }

  async function handleCreateRound(e: FormEvent) {
    e.preventDefault();
    if (!expandedSeries) return;
    if (roundNominees.length === 0) {
      setActionError("Select at least one player to nominate for the round");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/auction/series/${expandedSeries}/rounds`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          roundNo: rounds.length + 1,
          name: roundForm.name,
          type: roundForm.type,
          playerIds: roundNominees,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoundForm({ name: "", type: "MARQUEE" });
        setRoundNomineePick("");
        setRoundNominees([]);
        setShowRoundForm(false);
        loadSeriesDetail(expandedSeries, { toggle: false });
      } else { setActionError(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to create round"); }
    } catch { setActionError("Network error — could not create round"); } finally { setSaving(false); }
  }

  async function handlePlaceBid(e: FormEvent) {
    e.preventDefault();
    if (!expandedSeries) return;
    if (!activeRoundId) {
      setActionError("Select an auction round first");
      return;
    }
    setSaving(true);
    try {
      const bidAmountNum = parseFloat(bidForm.bidAmount);
      if (!Number.isFinite(bidAmountNum) || bidAmountNum <= 0) {
        setActionError("Enter a valid bid amount");
        return;
      }
      const res = await fetch(`/api/tournaments/${tournamentId}/auction/bids`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          auctionRoundId: activeRoundId,
          teamId: bidForm.teamId,
          playerId: bidForm.playerId,
          bidAmount: bidAmountNum,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBidForm({ teamId: "", playerId: "", auctionRoundId: "", bidAmount: "" });
        setShowBidDialog(false);
        loadSeriesDetail(expandedSeries, { toggle: false });
      } else { setActionError(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to place bid"); }
    } catch { setActionError("Network error — could not place bid"); } finally { setSaving(false); }
  }

  async function handleStartPlayerAuction(e: FormEvent) {
    e.preventDefault();
    if (!expandedSeries || !activeRoundId || !startPlayerId) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/auction/series/${expandedSeries}/rounds/${activeRoundId}/players/start`,
        {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify({ playerId: startPlayerId }),
        },
      );
      const data = await res.json();
      if (data.success) {
        setShowStartPlayerDialog(false);
        setStartPlayerId("");
        const base = activeRound?.nominees.find((n) => n.playerId === startPlayerId)?.basePrice ?? "";
        setBidForm({ teamId: "", playerId: startPlayerId, auctionRoundId: activeRoundId, bidAmount: base });
        setShowBidDialog(true);
        await loadSeriesDetail(expandedSeries, { toggle: false });
      } else {
        setActionError(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to start player auction");
      }
    } catch {
      setActionError("Network error — could not start this player auction");
    } finally {
      setSaving(false);
    }
  }

  async function handleSellPlayer(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/auction/sell`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ auctionBidId: sellForm.bidId }),
      });
      const data = await res.json();
      if (data.success) {
        setSellForm({ bidId: "" });
        setShowSellDialog(false);
        await fetchData();
        if (expandedSeries) loadSeriesDetail(expandedSeries, { toggle: false });
      } else { setActionError(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to sell player"); }
    } catch { setActionError("Network error — could not sell player"); } finally { setSaving(false); }
  }

  async function handleStartBidding(seriesId: string, roundId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/auction/series/${seriesId}/rounds/${roundId}/start`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.success && !data?.body?.success) {
        setActionError(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to start bidding");
        return;
      }
      await loadSeriesDetail(seriesId, { toggle: false });
    } catch {
      setActionError("Network error — could not start bidding");
    } finally {
      setSaving(false);
    }
  }

  async function handleCloseBidding(seriesId: string, roundId: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/auction/series/${seriesId}/rounds/${roundId}/close`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (!data.success && !data?.body?.success) {
        setActionError(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to close bidding");
        return;
      }
      await loadSeriesDetail(seriesId, { toggle: false });
    } catch {
      setActionError("Network error — could not close bidding");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-9 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const teamMap = new Map(teams.map(t => [t.id, t]));
  const playerMap = new Map(players.map(p => [p.id, p]));
  const salesFiltered = expandedSeries
    ? sales.filter((row) => row.auctionSeriesId === expandedSeries)
    : sales;

  const activeRound = rounds.find((r) => r.id === activeRoundId) ?? null;
  const anyRoundLive = rounds.some((r) => !!r.startsAt && !r.endsAt);
  const isActiveRoundLive = !!activeRound?.startsAt && !activeRound?.endsAt;
  const isActiveRoundClosed = !!activeRound?.endsAt;
  const activePlayerId = activeRound?.activePlayerId ?? "";
  const bidsForActiveRound = activeRoundId ? bids.filter((b) => b.auctionRoundId === activeRoundId) : [];
  const bidsForActivePlayer = activePlayerId ? bidsForActiveRound.filter((b) => b.playerId === activePlayerId) : [];
  const winningBidByPlayerId = new Map<string, Bid>(
    bidsForActiveRound.filter((b) => b.isWinningBid).map((b) => [b.playerId, b]),
  );
  const sellBid = sellForm.bidId ? bids.find((b) => b.id === sellForm.bidId) ?? null : null;

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="flex items-center gap-3 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="flex-1">{actionError}</span>
          <button className="text-xs underline" onClick={() => setActionError(null)}>Dismiss</button>
        </div>
      )}
      {expandedSeries && anyRoundLive && (
        <div className="flex items-center gap-3 rounded-md bg-primary/10 px-4 py-3 text-sm text-primary">
          <span className="flex-1 font-medium">Bidding is in progress</span>
          <Badge variant="outline" className="text-xs">LIVE</Badge>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Auction</h1>
        <div className="flex gap-2">
          {expandedSeries && (
            <>
              <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Place a Bid</DialogTitle></DialogHeader>
                  <form onSubmit={handlePlaceBid} className="grid gap-4">
                    <div className="space-y-1.5"><Label>Team</Label>
                      <Select value={bidForm.teamId} onChange={e => setBidForm(p => ({ ...p, teamId: e.target.value }))} required>
                        <option value="">Select team</option>
                        {teams.map(t => <option key={t.id} value={t.id}>{t.name} ({formatCurrency(t.purseRemaining)})</option>)}
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Player</Label>
                      <Select value={bidForm.playerId} onChange={e => setBidForm(p => ({ ...p, playerId: e.target.value }))} required>
                        <option value="">Select player</option>
                        {players.map(p => <option key={p.id} value={p.id}>{p.displayName} ({p.role.replace(/_/g, " ")})</option>)}
                      </Select>
                    </div>
                    <div className="space-y-1.5"><Label>Bid Amount (₹ Lakhs)</Label>
                      <Input type="number" step="0.5" value={bidForm.bidAmount} onChange={e => setBidForm(p => ({ ...p, bidAmount: e.target.value }))} required />
                    </div>
                    <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Submit Bid</Button>
                  </form>
                </DialogContent>
              </Dialog>

              {isAdmin && (
                <Dialog open={showStartPlayerDialog} onOpenChange={setShowStartPlayerDialog}>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Start Player Auction</DialogTitle></DialogHeader>
                    <form onSubmit={handleStartPlayerAuction} className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Start live bidding for{" "}
                        <span className="font-medium">{playerMap.get(startPlayerId)?.displayName ?? "selected player"}</span>?
                      </p>
                      <Button type="submit" disabled={saving || !startPlayerId}>
                        {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                        Yes, Start Auction
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              {isAdmin && (
                <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Confirm Sale</DialogTitle></DialogHeader>
                    <div className="space-y-1.5 text-sm">
                      <p>
                        Player:{" "}
                        <span className="font-medium">
                          {sellBid ? (playerMap.get(sellBid.playerId)?.displayName ?? sellBid.playerId) : "—"}
                        </span>
                      </p>
                      <p>
                        Buyer Team:{" "}
                        <span className="font-medium">
                          {sellBid ? (teamMap.get(sellBid.teamId)?.name ?? sellBid.teamId) : "—"}
                        </span>
                      </p>
                      <p>
                        Price:{" "}
                        <span className="font-medium">
                          {sellBid ? formatCurrency(sellBid.bidAmount) : "—"}
                        </span>
                      </p>
                    </div>

                    <form onSubmit={handleSellPlayer} className="mt-4 grid gap-4">
                      <Button type="submit" disabled={saving || !sellBid}>
                        {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                        Confirm Sale
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
          {isAdmin && (
            <Button size="sm" onClick={() => setShowSeriesForm(!showSeriesForm)}>
              <Plus className="mr-1 h-3.5 w-3.5" />New Series
            </Button>
          )}
        </div>
      </div>

      {showSeriesForm && (
        <Card><CardContent className="pt-6">
          <form onSubmit={handleCreateSeries} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label>Series Name</Label>
              <Input placeholder="Main Auction 2026" value={seriesName} onChange={e => setSeriesName(e.target.value)} required />
            </div>
            <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Create</Button>
            <Button type="button" variant="ghost" onClick={() => setShowSeriesForm(false)}>Cancel</Button>
          </form>
        </CardContent></Card>
      )}

      {series.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Gavel className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">Auction Management</h3>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Create an auction series to start managing player auctions with rounds, bids, and sales.
          </p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {series.map(s => (
            <Card key={s.id} className={expandedSeries === s.id ? "ring-2 ring-primary" : ""}>
              <CardHeader className="cursor-pointer" onClick={() => loadSeriesDetail(s.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedSeries === s.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <CardTitle className="text-base">{s.name}</CardTitle>
                  </div>
                  <Badge className={statusColors[s.status] || ""}>{s.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 rounded-lg border border-border p-4 text-sm md:grid-cols-4">
                  <div><p className="text-xs text-muted-foreground">Sequence</p><p className="font-medium">#{s.sequenceNo}</p></div>
                  <div><p className="text-xs text-muted-foreground">Rounds</p><p className="font-medium">{s.roundCount}</p></div>
                  <div><p className="text-xs text-muted-foreground">Players Sold</p><p className="font-medium">{s.totalPlayersSold}</p></div>
                  <div><p className="text-xs text-muted-foreground">Amount Spent</p><p className="font-medium">{formatCurrency(s.totalAmountSpent)}</p></div>
                </div>

                {expandedSeries === s.id && (
                  <div className="mt-4 space-y-4">
                    <Separator />

                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">Rounds ({rounds.length})</p>
                      {isAdmin && (
                        <Button size="sm" variant="outline" onClick={() => setShowRoundForm(!showRoundForm)}>
                          <Plus className="mr-1 h-3 w-3" />Add Round
                        </Button>
                      )}
                    </div>

                    {showRoundForm && (
                      <form onSubmit={handleCreateRound} className="grid gap-3 rounded-lg bg-muted/50 p-4 sm:grid-cols-4">
                        <div className="space-y-1"><Label>Name</Label>
                          <Input placeholder="Marquee Round 1" value={roundForm.name} onChange={e => setRoundForm(p => ({ ...p, name: e.target.value }))} required />
                        </div>
                        <div className="space-y-1"><Label>Type</Label>
                          <Select value={roundForm.type} onChange={e => setRoundForm(p => ({ ...p, type: e.target.value }))}>
                            {["MARQUEE","CAPPED","UNCAPPED","EMERGING","OVERSEAS","ACCELERATED"].map(t => <option key={t} value={t}>{t}</option>)}
                          </Select>
                        </div>
                        <div className="space-y-2 sm:col-span-4">
                          <Label>Nominate Players</Label>
                          <div className="flex items-center gap-2">
                            <Select value={roundNomineePick} onChange={(e) => setRoundNomineePick(e.target.value)}>
                              <option value="">Select player</option>
                              {players.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.displayName} ({p.role.replace(/_/g, " ")})
                                </option>
                              ))}
                            </Select>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                if (!roundNomineePick) return;
                                setRoundNominees((prev) =>
                                  prev.includes(roundNomineePick) ? prev : [...prev, roundNomineePick],
                                );
                                setRoundNomineePick("");
                              }}
                            >
                              Add
                            </Button>
                          </div>

                          {roundNominees.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {roundNominees.map((pid) => (
                                <Badge key={pid} variant="secondary" className="flex items-center gap-2">
                                  {playerMap.get(pid)?.displayName ?? pid}
                                  <button
                                    type="button"
                                    className="text-xs underline text-muted-foreground"
                                    onClick={() => setRoundNominees((prev) => prev.filter((x) => x !== pid))}
                                  >
                                    remove
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-end gap-2 sm:col-span-4">
                          <Button type="submit" size="sm" disabled={saving || roundNominees.length === 0}>
                            Create
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setShowRoundForm(false);
                              setRoundNomineePick("");
                              setRoundNominees([]);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    )}

                    {rounds.length > 0 && (
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>#</TableHead><TableHead>Round</TableHead><TableHead>Type</TableHead>
                          <TableHead>Players Sold</TableHead><TableHead>Amount</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {rounds.map(r => (
                            <TableRow
                              key={r.id}
                              className={r.id === activeRoundId ? "bg-primary/5 cursor-pointer" : "cursor-pointer"}
                              onClick={() => setActiveRoundId(r.id)}
                            >
                              <TableCell className="font-mono text-xs">{r.roundNo}</TableCell>
                              <TableCell className="font-medium">{r.name}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">{r.type}</Badge>
                                  {r.startsAt && !r.endsAt ? (
                                    <Badge className="bg-red-100 text-red-800" variant="outline">LIVE</Badge>
                                  ) : r.endsAt ? (
                                    <Badge className="bg-green-100 text-green-800" variant="outline">CLOSED</Badge>
                                  ) : (
                                    <Badge className="bg-gray-100 text-gray-700" variant="outline">PLANNED</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{r.playersSold}{r.maxPlayers ? ` / ${r.maxPlayers}` : ""}</TableCell>
                              <TableCell>{formatCurrency(r.amountSpent)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    {activeRound && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold">
                            Round Nominees ({activeRound.nominees.length})
                          </p>
                          {isAdmin && activeRound && (
                            <div className="flex items-center gap-2">
                              {!isActiveRoundLive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={saving}
                                  onClick={() => handleStartBidding(expandedSeries, activeRound.id)}
                                >
                                  Start Bidding
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  disabled={saving}
                                  onClick={() => handleCloseBidding(expandedSeries, activeRound.id)}
                                >
                                  End Bidding
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        {activeRound.nominees.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No nominated players for this round yet.
                          </p>
                        ) : (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead>Base</TableHead>
                                <TableHead>Highest Bid</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Action</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {activeRound.nominees.map((n) => {
                                const winningBid = winningBidByPlayerId.get(n.playerId);
                                const teamName = winningBid ? teamMap.get(winningBid.teamId)?.name : null;
                                return (
                                  <TableRow key={n.playerId}>
                                    <TableCell className="font-medium">
                                      {playerMap.get(n.playerId)?.displayName ?? n.playerId.slice(0, 8)}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {formatCurrency(n.basePrice)}
                                    </TableCell>
                                    <TableCell>
                                      {winningBid ? (
                                        <span className="font-medium">
                                          {formatCurrency(winningBid.bidAmount)}{teamName ? ` · ${teamName}` : ""}
                                        </span>
                                      ) : (
                                        <span className="text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {winningBid ? (
                                        <Badge className="bg-green-100 text-green-800">Leading</Badge>
                                      ) : activeRound?.activePlayerId === n.playerId ? (
                                        <Badge className="bg-blue-100 text-blue-800">LIVE NOW</Badge>
                                      ) : (
                                        <Badge variant="outline">Waiting</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {isActiveRoundLive && activeRound?.activePlayerId === n.playerId ? (
                                        <Button
                                          size="sm"
                                          disabled={saving}
                                          onClick={() => {
                                            setBidForm({ teamId: "", playerId: n.playerId, auctionRoundId: activeRound.id, bidAmount: "" });
                                            setShowBidDialog(true);
                                          }}
                                        >
                                          Bid
                                        </Button>
                                      ) : isAdmin && isActiveRoundLive && !winningBid ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={saving}
                                          onClick={() => {
                                            setStartPlayerId(n.playerId);
                                            setShowStartPlayerDialog(true);
                                          }}
                                        >
                                          Start Auction
                                        </Button>
                                      ) : isAdmin && winningBid ? (
                                        <Button
                                          size="sm"
                                          disabled={saving}
                                          onClick={() => {
                                            setSellForm({ bidId: winningBid.id });
                                            setShowSellDialog(true);
                                          }}
                                        >
                                          Sell Winner
                                        </Button>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}

                    {activeRound?.activePlayerId && (
                      <Card className="border-primary/30">
                        <CardHeader>
                          <CardTitle className="text-sm">
                            Live player: {playerMap.get(activeRound.activePlayerId)?.displayName ?? activeRound.activePlayerId}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <p>
                            Initial price:{" "}
                            <span className="font-medium">
                              {formatCurrency(activeRound.nominees.find((n) => n.playerId === activeRound.activePlayerId)?.basePrice ?? 0)}
                            </span>
                          </p>
                          <p>
                            Current highest:{" "}
                            <span className="font-semibold">
                              {winningBidByPlayerId.get(activeRound.activePlayerId)
                                ? formatCurrency(winningBidByPlayerId.get(activeRound.activePlayerId)!.bidAmount)
                                : "No bid yet"}
                            </span>
                          </p>
                          {bidsForActivePlayer.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Total bids on this player: {bidsForActivePlayer.length}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <Separator />
                    <p className="text-sm font-semibold">Recent Bids ({bids.length})</p>
                    {bids.length > 0 ? (
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>Player</TableHead><TableHead>Team</TableHead>
                          <TableHead>Amount</TableHead><TableHead>Bidder</TableHead>
                          <TableHead>Status</TableHead><TableHead>Time</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {bids.slice(0, 20).map(b => (
                            <TableRow key={b.id}>
                              <TableCell className="font-medium">{playerMap.get(b.playerId)?.displayName ?? b.playerId.slice(0, 8)}</TableCell>
                              <TableCell>{teamMap.get(b.teamId)?.name ?? b.teamId.slice(0, 8)}</TableCell>
                              <TableCell className="font-semibold">{formatCurrency(b.bidAmount)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{b.placedByDisplayName ?? "—"}</TableCell>
                              <TableCell>{b.isWinningBid ? <Badge className="bg-green-100 text-green-800">Leading</Badge> : <Badge variant="outline">Outbid</Badge>}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">{new Date(b.bidAt).toLocaleTimeString("en-IN")}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="py-4 text-center text-sm text-muted-foreground">No bids placed yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {sales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sold player history</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {expandedSeries
                    ? "Sales in this series (finalized purchases)."
                    : "All finalized auction sales for this tournament."}
                </p>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                {salesFiltered.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    No finalized sales in this series yet. Expand another series or finalize a winning bid after the round closes.
                  </p>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Series / Round</TableHead>
                      <TableHead>Bid time</TableHead>
                      <TableHead>Sold at</TableHead>
                      <TableHead>Finalized by</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesFiltered.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">{row.playerName}</TableCell>
                        <TableCell>
                          {row.teamName}
                          {row.teamCode ? (
                            <span className="ml-1 text-xs text-muted-foreground">({row.teamCode})</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(row.soldPrice)}</TableCell>
                        <TableCell className="text-xs">
                          <span className="block">{row.seriesName}</span>
                          <span className="text-muted-foreground">
                            {row.roundName} · {row.roundType.replace(/_/g, " ")}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(row.winningBidAt).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(row.soldAt).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.finalizedByDisplayName ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
