import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/server/auth.service";

export async function GET(req: Request) {
  const result = await getCurrentUser(req);
  return NextResponse.json(result.body, { status: result.status });
}
