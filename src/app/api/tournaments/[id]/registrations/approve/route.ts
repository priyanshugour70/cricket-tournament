import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { approveRejectRegistration } from "@/services/server/registrations.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await approveRejectRegistration(id, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
