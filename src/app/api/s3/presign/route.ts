import { NextResponse } from "next/server";
import { createS3PresignedUrlFromPayload } from "@/services/server/s3.service";

export async function POST(req: Request) {
  const payload = await req.json().catch(() => ({}));
  const result = await createS3PresignedUrlFromPayload(payload);
  return NextResponse.json(result.body, { status: result.status });
}

