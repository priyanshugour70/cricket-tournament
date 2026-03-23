import { NextResponse } from "next/server";
import { createPlayer, listPlayers } from "@/services/server/players.service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filters = {
    role: searchParams.get("role") ?? undefined,
    nationality: searchParams.get("nationality") ?? undefined,
    active: searchParams.has("active") ? searchParams.get("active") === "true" : undefined,
  };
  const result = await listPlayers(filters);
  return NextResponse.json(result.body, { status: result.status });
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  const result = await createPlayer(payload);
  return NextResponse.json(result.body, { status: result.status });
}
