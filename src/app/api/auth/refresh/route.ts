import { NextResponse } from "next/server";
import { refreshAccessToken } from "@/services/server/auth.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`refresh:${ip}`)) return rateLimitResponse();
  const payload = await req.json().catch(() => ({}));
  const result = await refreshAccessToken(payload);
  return NextResponse.json(result.body, { status: result.status });
}
