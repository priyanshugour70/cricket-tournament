import { NextResponse } from "next/server";
import {
  createTournament,
  listTournaments,
} from "@/services/server/tournaments.service";

export async function GET() {
  const result = await listTournaments();
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  const result = await createTournament(payload);
  return NextResponse.json(result.body, { status: result.status });
}

