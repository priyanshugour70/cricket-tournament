import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getPlayerById, updatePlayer } from "@/services/server/players.service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const result = await getPlayerById(id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await updatePlayer(id, payload);
  return NextResponse.json(result.body, { status: result.status });
}
