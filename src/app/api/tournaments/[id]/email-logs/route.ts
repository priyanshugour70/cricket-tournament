import { NextResponse } from "next/server";
import { listEmailLogs } from "@/services/server/email-logs.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await listEmailLogs(id);
  return NextResponse.json(result.body, { status: result.status });
}
