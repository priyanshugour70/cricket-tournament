import { NextResponse } from "next/server";
import { createLinkedPlayerProfile } from "@/services/server/auth.service";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  const result = await createLinkedPlayerProfile(req, payload);
  return NextResponse.json(result.body, { status: result.status });
}
