import { NextResponse } from "next/server";
import { createPresignedPutUrl } from "@/lib/aws-s3";

function safeString(v: unknown) {
  return typeof v === "string" ? v : undefined;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const contentType = safeString(body.contentType);
    const expiresInSecondsRaw = body.expiresInSeconds;
    const expiresInSeconds =
      typeof expiresInSecondsRaw === "number"
        ? expiresInSecondsRaw
        : typeof expiresInSecondsRaw === "string"
          ? Number(expiresInSecondsRaw)
          : undefined;

    const key =
      safeString(body.key) ??
      `uploads/${crypto.randomUUID()}`;

    const result = await createPresignedPutUrl({
      key,
      contentType: contentType ?? "application/octet-stream",
      expiresInSeconds: expiresInSeconds ?? 900,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 },
    );
  }
}

