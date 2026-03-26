import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { startAuctionRound } from "@/services/server/auction.service";

type Params = { params: Promise<{ id: string; seriesId: string; roundId: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await requireAuth(_req);
  if (!auth.ok) return auth.response;

  const { id, seriesId, roundId } = await params;
  const isSystemAdmin = auth.session.systemRole === "SUPER_ADMIN" || auth.session.systemRole === "ADMIN";
  if (!isSystemAdmin) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Only admins can start bidding" } },
      { status: 403 },
    );
  }

  const result = await startAuctionRound(id, seriesId, roundId);
  return NextResponse.json(result.body, { status: result.status });
}

