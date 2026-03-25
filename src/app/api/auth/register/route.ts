import { NextResponse } from "next/server";
import { registerUser } from "@/services/server/auth.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth";
import { safeJson } from "@/lib/api-utils";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`register:${ip}`)) return rateLimitResponse();
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await registerUser(parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
