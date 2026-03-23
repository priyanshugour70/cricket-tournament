import { NextResponse } from "next/server";
import { recalculatePointsTable } from "@/services/server/points-table.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await recalculatePointsTable(id);
  return NextResponse.json(result.body, { status: result.status });
}
