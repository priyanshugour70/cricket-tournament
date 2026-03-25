import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listBids, placeBid } from "@/services/server/auction.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const auctionSeriesId = searchParams.get("auctionSeriesId") ?? undefined;
  const result = await listBids(id, auctionSeriesId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await placeBid(id, payload);
  return NextResponse.json(result.body, { status: result.status });
}
