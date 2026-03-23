import { NextResponse } from "next/server";
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
  const { seriesId } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await createAuctionRound(seriesId, payload);
  return NextResponse.json(result.body, { status: result.status });
}
