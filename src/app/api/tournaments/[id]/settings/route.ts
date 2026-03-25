import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getSettings, updateSettings } from "@/services/server/settings.service";
import { safeJson } from "@/lib/api-utils";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSettings(id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await updateSettings(id, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
