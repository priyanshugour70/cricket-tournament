import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { sendMailFromPayload } from "@/services/server/mail.service";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const payload = await req.json().catch(() => ({}));
  const result = await sendMailFromPayload(payload);
  return NextResponse.json(result.body, { status: result.status });
}
