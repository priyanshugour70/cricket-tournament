import { ErrorCodes, errorResponse } from "@/types";

const MAX_BODY_SIZE = 512 * 1024; // 512 KB

/**
 * Safely parse JSON from a request with body size enforcement.
 * Returns the parsed object or a pre-built error response.
 */
export async function safeJson<T = unknown>(
  req: Request,
  maxBytes = MAX_BODY_SIZE,
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: ReturnType<typeof errorResponse> }> {
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > maxBytes) {
    return {
      ok: false,
      status: 413,
      body: errorResponse(ErrorCodes.VALIDATION_ERROR, `Request body too large (max ${Math.round(maxBytes / 1024)} KB)`),
    };
  }

  try {
    const text = await req.text();
    if (text.length > maxBytes) {
      return {
        ok: false,
        status: 413,
        body: errorResponse(ErrorCodes.VALIDATION_ERROR, `Request body too large (max ${Math.round(maxBytes / 1024)} KB)`),
      };
    }
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      status: 400,
      body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid JSON in request body"),
    };
  }
}
