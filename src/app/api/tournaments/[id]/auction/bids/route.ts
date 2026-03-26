import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listBids, placeBid } from "@/services/server/auction.service";
import { safeJson } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { ErrorCodes, errorResponse } from "@/types";

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

  const dataObj =
    typeof parsed.data === "object" && parsed.data
      ? (parsed.data as Record<string, unknown>)
      : null;
  const teamId = typeof dataObj?.teamId === "string" ? dataObj.teamId : null;

  const isSystemAdmin = auth.session.systemRole === "SUPER_ADMIN" || auth.session.systemRole === "ADMIN";
  if (!isSystemAdmin && !teamId) {
    return NextResponse.json(
      errorResponse(ErrorCodes.VALIDATION_ERROR, "teamId is required"),
      { status: 400 },
    );
  }

  if (!isSystemAdmin && teamId) {
    const access = await prisma.userTournamentAccess.findFirst({
      where: { userId: auth.session.userId, tournamentId: id, teamId },
      select: { id: true },
    });
    if (!access) {
      return NextResponse.json(
        errorResponse(ErrorCodes.FORBIDDEN, "You can only bid for your assigned team"),
        { status: 403 },
      );
    }
  }

  const xf = req.headers.get("x-forwarded-for");
  const ip = xf?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? undefined;
  const result = await placeBid(id, parsed.data, {
    placedByUserId: auth.session.userId,
    ipAddress: ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  return NextResponse.json(result.body, { status: result.status });
}
