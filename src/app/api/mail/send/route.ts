import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { sendMailFromPayload } from "@/services/server/mail.service";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await sendMailFromPayload(parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
