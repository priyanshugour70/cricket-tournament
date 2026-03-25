import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import {
  listTournamentPlayers,
  registerTournamentPlayer,
} from "@/services/server/tournaments.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await listTournamentPlayers(id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const session = await getSessionFromRequest(req);
  const result = await registerTournamentPlayer(id, payload, session?.userId ?? null);
  return NextResponse.json(result.body, { status: result.status });
}

