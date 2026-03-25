import { NextResponse } from "next/server";
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
  const payload = await req.json().catch(() => ({}));
  const result = await putRbacMatrix(payload);
  return NextResponse.json(result.body, { status: result.status });
}
