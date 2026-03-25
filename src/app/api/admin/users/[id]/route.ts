import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requirePermission } from "@/lib/admin-auth.server";
import { updateSystemUser } from "@/services/server/admin-users.service";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requirePermission(req, "admin.users.write");
  if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status });
  const { id } = await params;
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await updateSystemUser(id, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
