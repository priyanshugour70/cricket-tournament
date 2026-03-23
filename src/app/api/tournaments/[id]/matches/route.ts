import { NextResponse } from "next/server";
import {
  createTournamentMatch,
  listTournamentMatches,
} from "@/services/server/matches.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await listTournamentMatches(id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await createTournamentMatch(id, payload);
  return NextResponse.json(result.body, { status: result.status });
}
