import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sellPlayer } from "@/services/server/auction.service";
import { safeJson } from "@/lib/api-utils";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const isSystemAdmin = auth.session.systemRole === "SUPER_ADMIN" || auth.session.systemRole === "ADMIN";
  if (!isSystemAdmin) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Only admins can sell auction winners" } },
      { status: 403 },
    );
  }
  const { id } = await params;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await sellPlayer(id, parsed.data, { finalizedByUserId: auth.session.userId });
  return NextResponse.json(result.body, { status: result.status });
}
