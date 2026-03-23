import { NextResponse } from "next/server";
import { sellPlayer } from "@/services/server/auction.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await sellPlayer(id, payload);
  return NextResponse.json(result.body, { status: result.status });
}
