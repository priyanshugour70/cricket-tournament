import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import {
  listAuctionRounds,
  createAuctionRound,
} from "@/services/server/auction.service";

type Params = { params: Promise<{ id: string; seriesId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { seriesId } = await params;
  const result = await listAuctionRounds(seriesId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { seriesId } = await params;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await createAuctionRound(seriesId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
