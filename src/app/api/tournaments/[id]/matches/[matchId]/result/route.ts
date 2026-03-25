import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { updateMatchResult } from "@/services/server/matches.service";

type Params = { params: Promise<{ id: string; matchId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id, matchId } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await updateMatchResult(id, matchId, payload);
  return NextResponse.json(result.body, { status: result.status });
}
