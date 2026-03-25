import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/services/server/settings.service";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getSettings(id);
  return NextResponse.json(result.body, { status: result.status });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await updateSettings(id, payload);
  return NextResponse.json(result.body, { status: result.status });
}
