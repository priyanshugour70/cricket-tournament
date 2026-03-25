import { NextResponse } from "next/server";
import { safeJson } from "@/lib/api-utils";
import { requirePermission } from "@/lib/admin-auth.server";
import { getRbacMatrix, putRbacMatrix } from "@/services/server/admin-rbac.service";

export async function GET(req: Request) {
  const gate = await requirePermission(req, "admin.rbac.manage");
  if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status });
  const result = await getRbacMatrix();
  return NextResponse.json(result.body, { status: result.status });
}

export async function PUT(req: Request) {
  const gate = await requirePermission(req, "admin.rbac.manage");
  if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status });
  const parsed = await safeJson(req);
  if (!parsed.ok) return NextResponse.json(parsed.body, { status: parsed.status });
  const result = await putRbacMatrix(parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
