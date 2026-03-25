import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listBids, placeBid } from "@/services/server/auction.service";
import { safeJson } from "@/lib/api-utils";

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
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await placeBid(id, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
