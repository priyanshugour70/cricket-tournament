import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { listEmailLogs } from "@/services/server/email-logs.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = await listEmailLogs(id);
  return NextResponse.json(result.body, { status: result.status });
}
