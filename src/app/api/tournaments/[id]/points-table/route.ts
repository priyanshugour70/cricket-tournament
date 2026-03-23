import { NextResponse } from "next/server";
import { getPointsTable } from "@/services/server/points-table.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await getPointsTable(id);
  return NextResponse.json(result.body, { status: result.status });
}
