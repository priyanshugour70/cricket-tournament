import { NextResponse } from "next/server";
import { loginUser } from "@/services/server/auth.service";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  const result = await loginUser(payload);
  return NextResponse.json(result.body, { status: result.status });
}
