"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  Badge,
} from "@/components/ui";
import type { APIResponse } from "@/types";
import { useAuth } from "@/lib/auth-context";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

export default function TournamentPlayerRegistrationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { linkedPlayer, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    role: "BATTER",
    battingStyle: "RIGHT_HAND",
    bowlingStyle: "RIGHT_ARM_MEDIUM",
    isOverseas: "false",
    registrationNumber: "",
  });

  useEffect(() => {
    if (linkedPlayer) {
      setForm((p) => ({
        ...p,
        displayName: linkedPlayer.displayName,
        role: linkedPlayer.role,
      }));
    }
  }, [linkedPlayer]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...(linkedPlayer ? { playerId: linkedPlayer.id } : {}),
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        displayName: form.displayName,
        role: form.role,
        battingStyle: form.battingStyle,
        bowlingStyle: form.bowlingStyle,
        isOverseas: form.isOverseas === "true",
        registrationNumber: form.registrationNumber || undefined,
      };
      const res = await fetch(`/api/tournaments/${id}/players`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as APIResponse;
      if (!res.ok || !json.success) {
        throw new Error(
          typeof json.error === "string"
            ? json.error
            : json.error?.message ?? "Registration failed",
        );
      }
      setSuccess("Registration submitted successfully. Admin will review your profile.");
      setTimeout(() => {
        router.push(`/tournaments/${id}`);
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to register");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Button variant="ghost" asChild className="mb-4">
        <Link href={`/tournaments/${id}`}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Tournament
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Register Yourself as a Player</CardTitle>
        </CardHeader>
        <CardContent>
          {linkedPlayer && (
            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
              <p className="font-medium">Signed in with linked player</p>
              <p className="mt-1 text-muted-foreground">
                You are registering as <strong>{linkedPlayer.displayName}</strong>
                {linkedPlayer.code ? ` (${linkedPlayer.code})` : ""}. Updates below apply to that profile.
              </p>
            </div>
          )}
          {!authLoading && !isAuthenticated && (
            <p className="mb-4 text-sm text-muted-foreground">
              <Link href="/auth/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>{" "}
              to attach this registration to your linked player automatically.
            </p>
          )}
          <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
            {!linkedPlayer && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, firstName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />
                </div>
              </>
            )}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, displayName: e.target.value }))
                }
                required
                disabled={Boolean(linkedPlayer)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              >
                <option value="BATTER">Batter</option>
                <option value="BOWLER">Bowler</option>
                <option value="ALL_ROUNDER">All Rounder</option>
                <option value="WICKET_KEEPER">Wicket Keeper</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isOverseas">Player Type</Label>
              <Select
                id="isOverseas"
                value={form.isOverseas}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isOverseas: e.target.value }))
                }
              >
                <option value="false">Domestic</option>
                <option value="true">Overseas</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="battingStyle">Batting Style</Label>
              <Select
                id="battingStyle"
                value={form.battingStyle}
                onChange={(e) =>
                  setForm((p) => ({ ...p, battingStyle: e.target.value }))
                }
              >
                <option value="RIGHT_HAND">Right Hand</option>
                <option value="LEFT_HAND">Left Hand</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bowlingStyle">Bowling Style</Label>
              <Select
                id="bowlingStyle"
                value={form.bowlingStyle}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bowlingStyle: e.target.value }))
                }
              >
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="regNo">Registration Number (optional)</Label>
              <Input
                id="regNo"
                value={form.registrationNumber}
                onChange={(e) =>
                  setForm((p) => ({ ...p, registrationNumber: e.target.value }))
                }
                placeholder="REG-PLAYER-001"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Registration"}
              </Button>
            </div>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          {success && (
            <div className="mt-3">
              <Badge variant="secondary">{success}</Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
