import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPlayingXI, setPlayingXI } from "@/services/server/match-detail.service";
import { safeJson } from "@/lib/api-utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { matchId } = await params;
  const result = await getPlayingXI(matchId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { matchId } = await params;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await setPlayingXI(matchId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
