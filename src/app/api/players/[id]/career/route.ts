import { NextResponse } from "next/server";
import { getPlayerCareer } from "@/services/server/players.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await getPlayerCareer(id);
  return NextResponse.json(result.body, { status: result.status });
}
