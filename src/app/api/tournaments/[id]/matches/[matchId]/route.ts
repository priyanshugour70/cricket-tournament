import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { getMatchDetail, updateMatch } from "@/services/server/match-detail.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { matchId } = await params;
  const result = await getMatchDetail(matchId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { matchId } = await params;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await updateMatch(matchId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
