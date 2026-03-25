import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
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
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await createPlayer(parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
