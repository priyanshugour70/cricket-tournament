import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { markAsRead } from "@/services/server/notifications.service";

type Params = { params: Promise<{ notificationId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { notificationId } = await params;
  const result = await markAsRead(notificationId);
  return NextResponse.json(result.body, { status: result.status });
}
