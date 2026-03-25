import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listCommentary, addCommentary } from "@/services/server/scoring.service";

type Params = { params: Promise<{ matchId: string; inningsId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { inningsId } = await params;
  const result = await listCommentary(inningsId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { inningsId } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await addCommentary(inningsId, payload);
  return NextResponse.json(result.body, { status: result.status });
}
