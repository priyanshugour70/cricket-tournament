import type { SystemRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object") return payload as Record<string, unknown>;
  return {};
}

export async function listSystemUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        email: true,
        displayName: true,
        firstName: true,
        lastName: true,
        systemRole: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        loginCount: true,
      },
    });
    return {
      status: 200,
      body: successResponse(
        users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
        })),
      ),
    };
  } catch (error) {
    return {
      status: 500,
      body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to list users")),
    };
  }
}

export async function updateSystemUser(userId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const systemRole = body.systemRole as SystemRole | undefined;
    const isActive = typeof body.isActive === "boolean" ? body.isActive : undefined;

    if (systemRole === undefined && isActive === undefined) {
      return {
        status: 400,
        body: errorResponse(ErrorCodes.VALIDATION_ERROR, "systemRole and/or isActive required"),
      };
    }

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "User not found") };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(systemRole !== undefined ? { systemRole } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        systemRole: true,
        isActive: true,
        createdAt: true,
      },
    });

    return {
      status: 200,
      body: successResponse({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      }),
    };
  } catch (error) {
    return {
      status: 500,
      body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to update user")),
    };
  }
}
