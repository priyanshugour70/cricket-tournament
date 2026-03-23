/**
 * API response and error types for all routes.
 * Use successResponse / errorResponse in every API; use getErrorMessage in services and UI.
 */

// --- Base API response types ---

export interface APIResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: APIError | string;
    message?: string;
    timestamp?: string;
  }
  
  export interface APIError {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    stack?: string;
  }
  
  /** Legacy shape some endpoints may still send: { error: string } */
  export interface LegacyApiError {
    error: string;
  }
  
  export interface PaginatedResponse<T> extends APIResponse<T[]> {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }
  
  // --- Response helpers (use in every API route) ---
  
  export function successResponse<T>(data: T, message?: string): APIResponse<T> {
    return {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }
  
  export function errorResponse(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ): APIResponse<never> {
    return {
      success: false,
      error: { code, message, details },
      timestamp: new Date().toISOString(),
    };
  }
  
  export function paginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      timestamp: new Date().toISOString(),
    };
  }
  
  // --- Error codes (use in every API on failure) ---
  
  export const ErrorCodes = {
    UNAUTHORIZED: "UNAUTHORIZED",
    FORBIDDEN: "FORBIDDEN",
    INVALID_TOKEN: "INVALID_TOKEN",
    TOKEN_EXPIRED: "TOKEN_EXPIRED",
    INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
    EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    INVALID_INPUT: "INVALID_INPUT",
    NOT_FOUND: "NOT_FOUND",
    ALREADY_EXISTS: "ALREADY_EXISTS",
    INTERNAL_ERROR: "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
    TIMEOUT: "TIMEOUT",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    BAD_REQUEST: "BAD_REQUEST",
  } as const;
  
  export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export function getErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    if ("message" in error && typeof (error as { message?: unknown }).message === "string") {
      return (error as { message: string }).message;
    }
    if ("error" in error) {
      const err = (error as { error?: unknown }).error;
      if (typeof err === "string") return err;
      if (err && typeof err === "object" && "message" in err) {
        const msg = (err as { message?: unknown }).message;
        if (typeof msg === "string") return msg;
      }
    }
  }
  return fallback;
}