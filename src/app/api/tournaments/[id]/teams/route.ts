import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
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
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await createTournamentTeam(id, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
