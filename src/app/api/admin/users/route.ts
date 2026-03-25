import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/admin-auth.server";
import { listSystemUsers } from "@/services/server/admin-users.service";

export async function GET(req: Request) {
  const gate = await requirePermission(req, "admin.users.read");
  if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status });
  const result = await listSystemUsers();
  return NextResponse.json(result.body, { status: result.status });
}
