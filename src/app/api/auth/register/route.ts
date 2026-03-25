import { NextResponse } from "next/server";
import { registerUser } from "@/services/server/auth.service";
import { checkRateLimit, rateLimitResponse } from "@/lib/auth";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(`register:${ip}`)) return rateLimitResponse();
  const payload = await req.json().catch(() => ({}));
  const result = await registerUser(payload);
  return NextResponse.json(result.body, { status: result.status });
}
