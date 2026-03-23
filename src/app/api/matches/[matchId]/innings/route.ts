import { NextResponse } from "next/server";
import { listInnings, createInnings } from "@/services/server/scoring.service";

type Params = { params: Promise<{ matchId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { matchId } = await params;
  const result = await listInnings(matchId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request, { params }: Params) {
  const { matchId } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await createInnings(matchId, payload);
  return NextResponse.json(result.body, { status: result.status });
}
