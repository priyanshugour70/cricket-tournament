import { NextResponse } from "next/server";
import {
  createTournamentTeam,
  listTournamentTeams,
} from "@/services/server/tournaments.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await listTournamentTeams(id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await createTournamentTeam(id, payload);
  return NextResponse.json(result.body, { status: result.status });
}

