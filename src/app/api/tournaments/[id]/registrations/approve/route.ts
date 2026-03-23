import { NextResponse } from "next/server";
import { approveRejectRegistration } from "@/services/server/registrations.service";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const payload = await req.json().catch(() => ({}));
  const result = await approveRejectRegistration(id, payload);
  return NextResponse.json(result.body, { status: result.status });
}
