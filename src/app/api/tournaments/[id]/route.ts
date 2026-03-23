import { NextResponse } from "next/server";
import { getTournamentById, updateTournamentStatus } from "@/services/server/tournaments.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await getTournamentById(id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await updateTournamentStatus(id, payload);
  return NextResponse.json(result.body, { status: result.status });
}

