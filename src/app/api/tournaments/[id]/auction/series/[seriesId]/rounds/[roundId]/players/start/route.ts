import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { startRoundPlayerAuction } from "@/services/server/auction.service";

type Params = { params: Promise<{ id: string; seriesId: string; roundId: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  const isSystemAdmin = auth.session.systemRole === "SUPER_ADMIN" || auth.session.systemRole === "ADMIN";
  if (!isSystemAdmin) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Only admins can start player auction" } },
      { status: 403 },
    );
  }

  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });

  const { id, seriesId, roundId } = await params;
  const result = await startRoundPlayerAuction(id, seriesId, roundId, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
