import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { logoutUser } from "@/services/server/auth.service";

export async function POST(req: Request) {
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await logoutUser(req, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
