"use client";

import { useEffect, useState, useCallback, type FormEvent } from "react";
import { use } from "react";
import { Settings, Save, Loader2, AlertTriangle, Shield, Zap, Mail, Bell, Eye, Gavel } from "lucide-react";
import {
  Button, Badge, Input, Label, Card, CardContent, CardHeader, CardTitle,
  Select, Skeleton, Separator, Textarea,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

type TournamentData = {
  id: string; code: string; name: string; shortName: string | null;
  description?: string; season: number; format: string; status: string;
  organizerName: string | null; organizerEmail: string | null;
  venueCity: string | null; country: string | null; timezone: string;
  maxTeams: number; minSquadSize: number; maxSquadSize: number; overseasLimit: number;
  notes: string | null;
  startsOn: string | null; endsOn: string | null;
};

type SettingsData = {
  id: string; tournamentId: string;
  autoSchedule: boolean; allowLateReg: boolean; requireApproval: boolean;
  enableLiveScoring: boolean; enableCommentary: boolean; enableNotifications: boolean;
  emailOnRegistration: boolean; emailOnApproval: boolean; emailOnMatchResult: boolean;
  publicScoreboard: boolean; showPlayerStats: boolean; showTeamFinances: boolean;
  auctionBidTimeSec: number; auctionMinIncrement: string;
  matchDlsEnabled: boolean; powerplayEnd: number; middleOversEnd: number;
  maxOversPerBowler: number; freeHitOnNoBall: boolean;
  wideRunPenalty: number; noBallRunPenalty: number; customRules: string | null;
};

function Toggle({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary" />
      <div>
        <p className="text-sm font-medium leading-none">{label}</p>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
    </label>
  );
}

export default function SettingsPage({ params }: { params: Promise<{ tournamentId: string }> }) {
  const { tournamentId } = use(params);
  const { user } = useAuth();
  const isAdmin = user?.systemRole === "SUPER_ADMIN" || user?.systemRole === "ADMIN";

  const [tournament, setTournament] = useState<TournamentData | null>(null);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTournament, setSavingTournament] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [tournamentForm, setTournamentForm] = useState<Record<string, string>>({});
  const [statusValue, setStatusValue] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        fetch(`/api/tournaments/${tournamentId}`, { headers: authHeaders() }),
        fetch(`/api/tournaments/${tournamentId}/settings`, { headers: authHeaders() }),
      ]);
      const [tData, sData] = await Promise.all([tRes.json(), sRes.json()]);
      if (tData.success && tData.data) {
        setTournament(tData.data);
        setStatusValue(tData.data.status);
        setTournamentForm({
          name: tData.data.name ?? "",
          shortName: tData.data.shortName ?? "",
          description: tData.data.description ?? "",
          organizerName: tData.data.organizerName ?? "",
          organizerEmail: tData.data.organizerEmail ?? "",
          venueCity: tData.data.venueCity ?? "",
          country: tData.data.country ?? "",
          timezone: tData.data.timezone ?? "Asia/Kolkata",
          notes: tData.data.notes ?? "",
          maxTeams: String(tData.data.maxTeams ?? 8),
          minSquadSize: String(tData.data.minSquadSize ?? 15),
          maxSquadSize: String(tData.data.maxSquadSize ?? 25),
          overseasLimit: String(tData.data.overseasLimit ?? 4),
        });
      }
      if (sData.success && sData.data) setSettings(sData.data);
    } catch { setActionError("Failed to load settings"); } finally { setLoading(false); }
  }, [tournamentId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSaveTournament(e: FormEvent) {
    e.preventDefault();
    setSavingTournament(true);
    try {
      const payload: Record<string, unknown> = { ...tournamentForm };
      ["maxTeams", "minSquadSize", "maxSquadSize", "overseasLimit"].forEach(k => {
        if (payload[k]) payload[k] = parseInt(payload[k] as string, 10);
      });
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.data) { setTournament(data.data); setActionError(null); }
      else { setActionError(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to save tournament"); }
    } catch { setActionError("Network error — could not save tournament"); } finally { setSavingTournament(false); }
  }

  async function handleSaveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const { id: _id, tournamentId: _tid, ...payload } = settings;
      const res = await fetch(`/api/tournaments/${tournamentId}/settings`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.data) { setSettings(data.data); setActionError(null); }
      else { setActionError(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to save settings"); }
    } catch { setActionError("Network error — could not save settings"); } finally { setSavingSettings(false); }
  }

  async function handleChangeStatus() {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`, {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify({ status: statusValue }),
      });
      const data = await res.json();
      if (data.success && data.data) { setTournament(data.data); setActionError(null); }
      else { setActionError(typeof data.error === "string" ? data.error : data.error?.message ?? "Failed to update status"); }
    } catch { setActionError("Network error — could not change status"); } finally { setSavingStatus(false); }
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!isAdmin) return <div className="py-20 text-center"><p className="text-muted-foreground">Admin access required</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6" />
        <h1 className="text-xl font-bold">Tournament Settings</h1>
        {tournament && <Badge variant="outline">{tournament.status.replace(/_/g, " ")}</Badge>}
      </div>

      {actionError && (
        <div className="flex items-center gap-3 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="flex-1">{actionError}</span>
          <button className="text-xs underline" onClick={() => setActionError(null)}>Dismiss</button>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4" />General Configuration</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSaveTournament} className="grid gap-4 sm:grid-cols-2">
            {[
              { id: "name", label: "Tournament Name", required: true },
              { id: "shortName", label: "Short Name" },
              { id: "organizerName", label: "Organizer" },
              { id: "organizerEmail", label: "Organizer Email" },
              { id: "venueCity", label: "Venue City" },
              { id: "country", label: "Country" },
              { id: "timezone", label: "Timezone" },
              { id: "maxTeams", label: "Max Teams", type: "number" },
              { id: "minSquadSize", label: "Min Squad Size", type: "number" },
              { id: "maxSquadSize", label: "Max Squad Size", type: "number" },
              { id: "overseasLimit", label: "Overseas Limit", type: "number" },
            ].map(f => (
              <div key={f.id} className="space-y-1.5">
                <Label htmlFor={f.id}>{f.label}</Label>
                <Input id={f.id} type={f.type || "text"} value={tournamentForm[f.id] ?? ""} required={f.required}
                  onChange={e => setTournamentForm(p => ({ ...p, [f.id]: e.target.value }))} />
              </div>
            ))}
            <div className="col-span-full space-y-1.5">
              <Label>Description</Label>
              <Textarea value={tournamentForm.description ?? ""} rows={3}
                onChange={e => setTournamentForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="col-span-full space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={tournamentForm.notes ?? ""} rows={2}
                onChange={e => setTournamentForm(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div className="col-span-full">
              <Button type="submit" disabled={savingTournament}>
                {savingTournament ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                Save Configuration
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {settings && (
        <>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Bell className="h-4 w-4" />Registration & Notifications</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Require Approval" description="Manually approve player registrations" checked={settings.requireApproval}
                onChange={v => setSettings(s => s ? { ...s, requireApproval: v } : s)} />
              <Toggle label="Allow Late Registration" description="Accept registrations after deadline" checked={settings.allowLateReg}
                onChange={v => setSettings(s => s ? { ...s, allowLateReg: v } : s)} />
              <Toggle label="Enable Notifications" description="Send in-app notifications" checked={settings.enableNotifications}
                onChange={v => setSettings(s => s ? { ...s, enableNotifications: v } : s)} />
              <Toggle label="Email on Registration" description="Send email when player registers" checked={settings.emailOnRegistration}
                onChange={v => setSettings(s => s ? { ...s, emailOnRegistration: v } : s)} />
              <Toggle label="Email on Approval" description="Notify player on approval/rejection" checked={settings.emailOnApproval}
                onChange={v => setSettings(s => s ? { ...s, emailOnApproval: v } : s)} />
              <Toggle label="Email on Match Result" description="Send result emails after matches" checked={settings.emailOnMatchResult}
                onChange={v => setSettings(s => s ? { ...s, emailOnMatchResult: v } : s)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Eye className="h-4 w-4" />Visibility & Display</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Toggle label="Public Scoreboard" description="Show live scores to public" checked={settings.publicScoreboard}
                onChange={v => setSettings(s => s ? { ...s, publicScoreboard: v } : s)} />
              <Toggle label="Show Player Stats" description="Display player statistics publicly" checked={settings.showPlayerStats}
                onChange={v => setSettings(s => s ? { ...s, showPlayerStats: v } : s)} />
              <Toggle label="Show Team Finances" description="Display purse details publicly" checked={settings.showTeamFinances}
                onChange={v => setSettings(s => s ? { ...s, showTeamFinances: v } : s)} />
              <Toggle label="Enable Live Scoring" description="Allow ball-by-ball scoring" checked={settings.enableLiveScoring}
                onChange={v => setSettings(s => s ? { ...s, enableLiveScoring: v } : s)} />
              <Toggle label="Enable Commentary" description="Allow match commentary" checked={settings.enableCommentary}
                onChange={v => setSettings(s => s ? { ...s, enableCommentary: v } : s)} />
              <Toggle label="Auto Schedule" description="Automatically generate match schedule" checked={settings.autoSchedule}
                onChange={v => setSettings(s => s ? { ...s, autoSchedule: v } : s)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Zap className="h-4 w-4" />Match Rules</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Powerplay End (Over)</Label>
                <Input type="number" value={settings.powerplayEnd}
                  onChange={e => setSettings(s => s ? { ...s, powerplayEnd: parseInt(e.target.value) || 6 } : s)} />
              </div>
              <div className="space-y-1.5">
                <Label>Middle Overs End</Label>
                <Input type="number" value={settings.middleOversEnd}
                  onChange={e => setSettings(s => s ? { ...s, middleOversEnd: parseInt(e.target.value) || 15 } : s)} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Overs Per Bowler</Label>
                <Input type="number" value={settings.maxOversPerBowler}
                  onChange={e => setSettings(s => s ? { ...s, maxOversPerBowler: parseInt(e.target.value) || 4 } : s)} />
              </div>
              <div className="space-y-1.5">
                <Label>Wide Run Penalty</Label>
                <Input type="number" value={settings.wideRunPenalty}
                  onChange={e => setSettings(s => s ? { ...s, wideRunPenalty: parseInt(e.target.value) || 1 } : s)} />
              </div>
              <div className="space-y-1.5">
                <Label>No Ball Penalty</Label>
                <Input type="number" value={settings.noBallRunPenalty}
                  onChange={e => setSettings(s => s ? { ...s, noBallRunPenalty: parseInt(e.target.value) || 1 } : s)} />
              </div>
              <div className="flex items-end">
                <Toggle label="Free Hit on No Ball" checked={settings.freeHitOnNoBall}
                  onChange={v => setSettings(s => s ? { ...s, freeHitOnNoBall: v } : s)} />
              </div>
              <Toggle label="DLS Method Enabled" description="Duckworth-Lewis-Stern for rain-affected matches" checked={settings.matchDlsEnabled}
                onChange={v => setSettings(s => s ? { ...s, matchDlsEnabled: v } : s)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Gavel className="h-4 w-4" />Auction Configuration</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Bid Timer (seconds)</Label>
                <Input type="number" value={settings.auctionBidTimeSec}
                  onChange={e => setSettings(s => s ? { ...s, auctionBidTimeSec: parseInt(e.target.value) || 30 } : s)} />
              </div>
              <div className="space-y-1.5">
                <Label>Min Bid Increment (₹ Lakhs)</Label>
                <Input type="number" value={settings.auctionMinIncrement}
                  onChange={e => setSettings(s => s ? { ...s, auctionMinIncrement: e.target.value } : s)} />
              </div>
            </CardContent>
          </Card>

          <div className="col-span-full space-y-1.5">
            <Label>Custom Rules</Label>
            <Textarea value={settings.customRules ?? ""} rows={3} placeholder="Any custom rules for this tournament..."
              onChange={e => setSettings(s => s ? { ...s, customRules: e.target.value } : s)} />
          </div>

          <Button onClick={handleSaveSettings} disabled={savingSettings}>
            {savingSettings ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
            Save All Settings
          </Button>
        </>
      )}

      <Separator />

      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader><CardTitle className="flex items-center gap-2 text-sm text-orange-700"><AlertTriangle className="h-4 w-4" />Status Management</CardTitle></CardHeader>
        <CardContent className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label>Tournament Status</Label>
            <Select value={statusValue} onChange={e => setStatusValue(e.target.value)}>
              {["DRAFT","REGISTRATION_OPEN","REGISTRATION_CLOSED","AUCTION_SCHEDULED","AUCTION_IN_PROGRESS","AUCTION_COMPLETED","SCHEDULE_READY","LIVE","COMPLETED","CANCELLED","ARCHIVED"].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </Select>
          </div>
          <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100" disabled={savingStatus} onClick={handleChangeStatus}>
            {savingStatus && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
