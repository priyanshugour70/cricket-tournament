import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createTournament,
  listTournaments,
} from "@/services/server/tournaments.service";
import { safeJson } from "@/lib/api-utils";

export async function GET() {
  const result = await listTournaments();
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await createTournament(parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
