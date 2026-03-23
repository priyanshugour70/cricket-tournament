import { NextResponse } from "next/server";
import { sendMailFromPayload } from "@/services/server/mail.service";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  const result = await sendMailFromPayload(payload);
  return NextResponse.json(result.body, { status: result.status });
}

