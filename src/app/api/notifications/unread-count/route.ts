import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getUnreadCount } from "@/services/server/notifications.service";

export async function GET(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const result = await getUnreadCount(auth.session.userId);
  return NextResponse.json(result.body, { status: result.status });
}
