import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getTournamentById, updateTournament } from "@/services/server/tournaments.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await getTournamentById(id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await updateTournament(id, payload);
  return NextResponse.json(result.body, { status: result.status });
}
