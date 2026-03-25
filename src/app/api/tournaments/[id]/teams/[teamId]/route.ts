import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTeamDetail, updateTeam } from "@/services/server/tournaments.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; teamId: string }> }) {
  const { id, teamId } = await params;
  const result = await getTeamDetail(id, teamId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; teamId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id, teamId } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await updateTeam(id, teamId, payload);
  return NextResponse.json(result.body, { status: result.status });
}
