import { NextResponse } from "next/server";
import { getUnreadCount } from "@/services/server/notifications.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? "";
  const result = await getUnreadCount(userId);
  return NextResponse.json(result.body, { status: result.status });
}
