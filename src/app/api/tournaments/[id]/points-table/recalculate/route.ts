import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { recalculatePointsTable } from "@/services/server/points-table.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = await recalculatePointsTable(id);
  return NextResponse.json(result.body, { status: result.status });
}
