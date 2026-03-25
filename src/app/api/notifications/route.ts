import { NextResponse } from "next/server";
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
  const payload = await req.json().catch(() => ({}));
  const result = await createNotification(payload);
  return NextResponse.json(result.body, { status: result.status });
}
