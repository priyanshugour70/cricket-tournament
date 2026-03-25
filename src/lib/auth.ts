import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { ErrorCodes, errorResponse } from "@/types";

export interface TokenPayload {
  userId: string;
  email: string;
  systemRole: string;
}

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return new TextEncoder().encode(secret);
};

export async function signAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload, typ: "access" } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecret());
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
}

export async function signRefreshToken(
  payload: RefreshTokenPayload,
): Promise<string> {
  return new SignJWT({ ...payload, typ: "refresh" } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyRefreshToken(
  token: string,
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const p = payload as unknown as Record<string, unknown>;
    if (p.typ !== "refresh") return null;
    if (
      typeof p.userId === "string" &&
      typeof p.sessionId === "string"
    ) {
      return { userId: p.userId, sessionId: p.sessionId };
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifyAccessToken(
  token: string,
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const p = payload as unknown as Record<string, unknown>;
    if (p.typ !== "access" && p.typ !== undefined) return null;
    if (typeof p.userId !== "string" || typeof p.email !== "string" || typeof p.systemRole !== "string") return null;
    return { userId: p.userId, email: p.email, systemRole: p.systemRole };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSessionFromRequest(
  req: Request,
): Promise<TokenPayload | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7);
  return verifyAccessToken(token);
}

/** Reusable auth guard — returns session or a 401 NextResponse. */
export async function requireAuth(req: Request): Promise<
  | { ok: true; session: TokenPayload }
  | { ok: false; response: NextResponse }
> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        errorResponse(ErrorCodes.UNAUTHORIZED, "Authentication required"),
        { status: 401 },
      ),
    };
  }
  return { ok: true, session };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return false;
  return true;
}

export function rateLimitResponse(): NextResponse {
  return NextResponse.json(
    errorResponse(ErrorCodes.FORBIDDEN, "Too many requests. Please try again later."),
    { status: 429 },
  );
}
