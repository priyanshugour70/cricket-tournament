import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { listNotifications, createNotification } from "@/services/server/notifications.service";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(req.url);
  const tournamentId = searchParams.get("tournamentId") ?? undefined;
  const result = await listNotifications(auth.session.userId, tournamentId);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await createNotification(parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
