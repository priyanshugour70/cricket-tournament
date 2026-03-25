import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  listAuctionSeries,
  createAuctionSeries,
} from "@/services/server/auction.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await listAuctionSeries(id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await createAuctionSeries(id, payload);
  return NextResponse.json(result.body, { status: result.status });
}
