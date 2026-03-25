import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
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
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const session = await getSessionFromRequest(req);
  const result = await registerTournamentPlayer(id, parsed.data, session?.userId ?? null);
  return NextResponse.json(result.body, { status: result.status });
}

