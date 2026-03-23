import { createPresignedPutUrl } from "@/lib/aws-s3";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
  type APIResponse,
} from "@/types";
import type {
  CreateS3PresignData,
  CreateS3PresignRequest,
} from "@/types/api/integrations";

function safeString(v: unknown) {
  return typeof v === "string" ? v : undefined;
}

function parsePositiveInt(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return Math.trunc(v);
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n) && n > 0) return Math.trunc(n);
  }
  return undefined;
}

export async function createS3PresignedUrlFromPayload(
  payload: unknown,
): Promise<{ status: number; body: APIResponse<CreateS3PresignData> }> {
  try {
    const body = (payload ?? {}) as Record<string, unknown>;
    const request: CreateS3PresignRequest = {
      key: safeString(body.key),
      contentType: safeString(body.contentType) ?? "application/octet-stream",
      expiresInSeconds: parsePositiveInt(body.expiresInSeconds) ?? 900,
    };

    const key = request.key ?? `uploads/${crypto.randomUUID()}`;
    const result = await createPresignedPutUrl({
      key,
      contentType: request.contentType,
      expiresInSeconds: request.expiresInSeconds,
    });

    return {
      status: 200,
      body: successResponse(
        { url: result.url, bucket: result.bucket, key: result.key },
        "Presigned URL created",
      ),
    };
  } catch (error) {
    return {
      status: 400,
      body: errorResponse(
        ErrorCodes.BAD_REQUEST,
        getErrorMessage(error, "Unable to create presigned URL"),
      ),
    };
  }
}

