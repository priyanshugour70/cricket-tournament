import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createS3PresignedUrlFromPayload } from "@/services/server/s3.service";

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  const payload = await req.json().catch(() => ({}));
  const result = await createS3PresignedUrlFromPayload(payload);
  return NextResponse.json(result.body, { status: result.status });
}
