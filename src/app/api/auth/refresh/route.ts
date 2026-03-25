import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { refreshAccessToken } from "@/services/server/auth.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`refresh:${ip}`)) return rateLimitResponse();
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await refreshAccessToken(parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
