import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  createTournament,
  listTournaments,
} from "@/services/server/tournaments.service";

export async function GET() {
  const result = await listTournaments();
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const payload = await req.json().catch(() => ({}));
  const result = await createTournament(payload);
  return NextResponse.json(result.body, { status: result.status });
}
