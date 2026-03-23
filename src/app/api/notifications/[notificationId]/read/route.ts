import { NextResponse } from "next/server";
import { markAsRead } from "@/services/server/notifications.service";

type Params = { params: Promise<{ notificationId: string }> };

export async function PATCH(_req: Request, { params }: Params) {
  const { notificationId } = await params;
  const result = await markAsRead(notificationId);
  return NextResponse.json(result.body, { status: result.status });
}
