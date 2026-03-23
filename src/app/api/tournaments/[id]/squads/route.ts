import { NextResponse } from "next/server";
import { listSquadPlayers } from "@/services/server/squads.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await listSquadPlayers(id);
  return NextResponse.json(result.body, { status: result.status });
}
