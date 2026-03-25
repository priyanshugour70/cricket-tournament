import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { listBalls, addBall } from "@/services/server/scoring.service";

type Params = { params: Promise<{ matchId: string; inningsId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { inningsId } = await params;
  const result = await listBalls(inningsId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { inningsId } = await params;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await addBall(inningsId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
