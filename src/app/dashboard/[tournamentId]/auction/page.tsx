"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { use } from "react";
import { Gavel, Plus, Loader2, Users, ChevronDown, ChevronRight, DollarSign, Check } from "lucide-react";
import {
  Button, Badge, Input, Label, Select, Card, CardHeader, CardTitle, CardContent,
  Skeleton, Separator, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
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

type AuctionSeries = {
  id: string; name: string; status: string; sequenceNo: number;
  roundCount: number; totalPlayersSold: number; totalAmountSpent: string;
};

type AuctionRound = {
  id: string; roundNo: number; name: string; type: string;
  maxPlayers: number | null; playersSold: number; amountSpent: string;
};

type Team = { id: string; name: string; code: string; purseRemaining: string };
type Player = { id: string; displayName: string; role: string; basePrice: string | null };
type Bid = {
  id: string; teamId: string; playerId: string; bidAmount: string;
  isWinningBid: boolean; bidAt: string;
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

  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [seriesName, setSeriesName] = useState("");

  const [expandedSeries, setExpandedSeries] = useState<string>("");
  const [rounds, setRounds] = useState<AuctionRound[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);

  const [showRoundForm, setShowRoundForm] = useState(false);
  const [roundForm, setRoundForm] = useState({ name: "", type: "MARQUEE", maxPlayers: "" });

  const [showBidDialog, setShowBidDialog] = useState(false);
  const [bidForm, setBidForm] = useState({ teamId: "", playerId: "", bidAmount: "" });

  const [showSellDialog, setShowSellDialog] = useState(false);
  const [sellForm, setSellForm] = useState({ bidId: "" });

  const fetchData = useCallback(async () => {
    try {
      const [sRes, tRes, pRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/auction/series`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/teams`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/players`, { headers: authHeaders() }),
      ]);
      const [sData, tData, pData] = await Promise.all([sRes.json(), tRes.json(), pRes.json()]);
      if (sData.success) setSeries(sData.data ?? []);
      if (tData.success) setTeams(tData.data ?? []);
      if (pData.success) {
        setPlayers((pData.data ?? []).map((r: Record<string, unknown>) => ({
          id: String(r.playerId ?? r.id ?? ""),
          displayName: String(r.displayName ?? ""),
          role: String(r.role ?? ""),
          basePrice: r.basePrice ? String(r.basePrice) : null,
        })));
      }
    } catch { /* empty */ } finally { setLoading(false); }
  }, [tournamentId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function loadSeriesDetail(seriesId: string) {
    if (expandedSeries === seriesId) { setExpandedSeries(""); return; }
    setExpandedSeries(seriesId);
    try {
      const [rRes, bRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}/auction/series/${seriesId}/rounds`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/auction/bids?seriesId=${seriesId}`, { headers: authHeaders() }),
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
    } catch { /* empty */ } finally { setSaving(false); }
  }

  async function handleCreateRound(e: FormEvent) {
    e.preventDefault();
    if (!expandedSeries) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/auction/series/${expandedSeries}/rounds`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          ...roundForm,
          roundNo: rounds.length + 1,
          maxPlayers: roundForm.maxPlayers ? parseInt(roundForm.maxPlayers) : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRoundForm({ name: "", type: "MARQUEE", maxPlayers: "" });
        setShowRoundForm(false);
        loadSeriesDetail(expandedSeries);
      }
    } catch { /* empty */ } finally { setSaving(false); }
  }

  async function handlePlaceBid(e: FormEvent) {
    e.preventDefault();
    if (!expandedSeries) return;
    setSaving(true);
    try {
      const roundId = rounds[rounds.length - 1]?.id;
      const res = await fetch(`/api/tournaments/${tournamentId}/auction/bids`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({
          auctionSeriesId: expandedSeries,
          auctionRoundId: roundId || undefined,
          teamId: bidForm.teamId,
          playerId: bidForm.playerId,
          bidAmount: parseFloat(bidForm.bidAmount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBidForm({ teamId: "", playerId: "", bidAmount: "" });
        setShowBidDialog(false);
        loadSeriesDetail(expandedSeries);
      }
    } catch { /* empty */ } finally { setSaving(false); }
  }

  async function handleSellPlayer(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/auction/sell`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ bidId: sellForm.bidId }),
      });
      const data = await res.json();
      if (data.success) {
        setSellForm({ bidId: "" });
        setShowSellDialog(false);
        fetchData();
        if (expandedSeries) loadSeriesDetail(expandedSeries);
      }
    } catch { /* empty */ } finally { setSaving(false); }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-9 w-48" /><Skeleton className="h-64 w-full" /></div>;

  const teamMap = new Map(teams.map(t => [t.id, t]));
  const playerMap = new Map(players.map(p => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Auction</h1>
        <div className="flex gap-2">
          {isAdmin && expandedSeries && (
            <>
              <Dialog open={showBidDialog} onOpenChange={setShowBidDialog}>
                <DialogTrigger asChild><Button size="sm" variant="outline"><DollarSign className="mr-1 h-3.5 w-3.5" />Place Bid</Button></DialogTrigger>
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

              <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
                <DialogTrigger asChild><Button size="sm"><Check className="mr-1 h-3.5 w-3.5" />Sell Player</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Confirm Sale</DialogTitle></DialogHeader>
                  <form onSubmit={handleSellPlayer} className="grid gap-4">
                    <div className="space-y-1.5"><Label>Select Winning Bid</Label>
                      <Select value={sellForm.bidId} onChange={e => setSellForm({ bidId: e.target.value })} required>
                        <option value="">Select bid</option>
                        {bids.filter(b => !b.isWinningBid).map(b => {
                          const team = teamMap.get(b.teamId);
                          const player = playerMap.get(b.playerId);
                          return <option key={b.id} value={b.id}>{player?.displayName ?? "?"} → {team?.name ?? "?"} for {formatCurrency(b.bidAmount)}</option>;
                        })}
                      </Select>
                    </div>
                    <Button type="submit" disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}Confirm Sale</Button>
                  </form>
                </DialogContent>
              </Dialog>
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
                        <div className="space-y-1"><Label>Max Players</Label>
                          <Input type="number" placeholder="10" value={roundForm.maxPlayers} onChange={e => setRoundForm(p => ({ ...p, maxPlayers: e.target.value }))} />
                        </div>
                        <div className="flex items-end gap-2">
                          <Button type="submit" size="sm" disabled={saving}>Create</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setShowRoundForm(false)}>Cancel</Button>
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
                            <TableRow key={r.id}>
                              <TableCell className="font-mono text-xs">{r.roundNo}</TableCell>
                              <TableCell className="font-medium">{r.name}</TableCell>
                              <TableCell><Badge variant="outline" className="text-xs">{r.type}</Badge></TableCell>
                              <TableCell>{r.playersSold}{r.maxPlayers ? ` / ${r.maxPlayers}` : ""}</TableCell>
                              <TableCell>{formatCurrency(r.amountSpent)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}

                    <Separator />
                    <p className="text-sm font-semibold">Recent Bids ({bids.length})</p>
                    {bids.length > 0 ? (
                      <Table>
                        <TableHeader><TableRow>
                          <TableHead>Player</TableHead><TableHead>Team</TableHead>
                          <TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Time</TableHead>
                        </TableRow></TableHeader>
                        <TableBody>
                          {bids.slice(0, 20).map(b => (
                            <TableRow key={b.id}>
                              <TableCell className="font-medium">{playerMap.get(b.playerId)?.displayName ?? b.playerId.slice(0, 8)}</TableCell>
                              <TableCell>{teamMap.get(b.teamId)?.name ?? b.teamId.slice(0, 8)}</TableCell>
                              <TableCell className="font-semibold">{formatCurrency(b.bidAmount)}</TableCell>
                              <TableCell>{b.isWinningBid ? <Badge className="bg-green-100 text-green-800">SOLD</Badge> : <Badge variant="outline">Bid</Badge>}</TableCell>
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
        </div>
      )}
    </div>
  );
}
