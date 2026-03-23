import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  comparePassword,
  getSessionFromRequest,
  hashPassword,
  signAccessToken,
} from "@/lib/auth";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";
import type {
  AuthResponse,
  AuthUser,
  TournamentAccessItem,
} from "@/types/api/auth";

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object") return payload as Record<string, unknown>;
  return {};
}

function safeString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

async function fetchTournamentAccesses(
  userId: string,
): Promise<TournamentAccessItem[]> {
  const accesses = await prisma.userTournamentAccess.findMany({
    where: { userId, isActive: true },
    include: { tournament: { select: { name: true, code: true } } },
  });
  return accesses.map((a) => ({
    tournamentId: a.tournamentId,
    tournamentName: a.tournament.name,
    tournamentCode: a.tournament.code,
    role: a.role,
    teamId: a.teamId,
  }));
}

function mapAuthUser(user: {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  systemRole: string;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    systemRole: user.systemRole,
  };
}

async function buildAuthResponse(
  user: {
    id: string;
    email: string;
    displayName: string;
    firstName: string;
    lastName: string | null;
    avatarUrl: string | null;
    systemRole: string;
  },
  token: string,
): Promise<AuthResponse> {
  const tournamentAccesses = await fetchTournamentAccesses(user.id);
  return {
    user: mapAuthUser(user),
    token,
    tournamentAccesses,
  };
}

export async function registerUser(payload: unknown) {
  try {
    const body = asRecord(payload);
    const email = safeString(body.email);
    const password = safeString(body.password);
    const firstName = safeString(body.firstName);
    const displayName = safeString(body.displayName);
    const lastName = safeString(body.lastName);
    const phone = safeString(body.phone);

    if (!email || !password || !firstName || !displayName) {
      return {
        status: 400,
        body: errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "email, password, firstName and displayName are required",
        ),
      };
    }

    if (password.length < 8) {
      return {
        status: 400,
        body: errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "Password must be at least 8 characters",
        ),
      };
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return {
        status: 409,
        body: errorResponse(ErrorCodes.ALREADY_EXISTS, "Email is already registered"),
      };
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, displayName, phone },
    });

    const token = await signAccessToken({
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole,
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const authResponse = await buildAuthResponse(user, token);
    return { status: 201, body: successResponse(authResponse, "Registration successful") };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        status: 409,
        body: errorResponse(ErrorCodes.ALREADY_EXISTS, "Email is already registered"),
      };
    }
    return {
      status: 500,
      body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Registration failed")),
    };
  }
}

export async function loginUser(payload: unknown) {
  try {
    const body = asRecord(payload);
    const email = safeString(body.email);
    const password = safeString(body.password);

    if (!email || !password) {
      return {
        status: 400,
        body: errorResponse(ErrorCodes.VALIDATION_ERROR, "email and password are required"),
      };
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return {
        status: 401,
        body: errorResponse(ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password"),
      };
    }

    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) {
      return {
        status: 401,
        body: errorResponse(ErrorCodes.INVALID_CREDENTIALS, "Invalid email or password"),
      };
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
    });

    const token = await signAccessToken({
      userId: user.id,
      email: user.email,
      systemRole: user.systemRole,
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const authResponse = await buildAuthResponse(user, token);
    return { status: 200, body: successResponse(authResponse, "Login successful") };
  } catch (error) {
    return {
      status: 500,
      body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Login failed")),
    };
  }
}

export async function getCurrentUser(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return {
        status: 401,
        body: errorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated"),
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId, isActive: true },
    });
    if (!user) {
      return {
        status: 401,
        body: errorResponse(ErrorCodes.UNAUTHORIZED, "User not found or inactive"),
      };
    }

    const token = req.headers.get("authorization")!.slice(7);
    const authResponse = await buildAuthResponse(user, token);
    return { status: 200, body: successResponse(authResponse) };
  } catch (error) {
    return {
      status: 500,
      body: errorResponse(
        ErrorCodes.INTERNAL_ERROR,
        getErrorMessage(error, "Failed to fetch user"),
      ),
    };
  }
}
