import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { updateMatchResult } from "@/services/server/matches.service";

type Params = { params: Promise<{ id: string; matchId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id, matchId } = await params;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await updateMatchResult(id, matchId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
