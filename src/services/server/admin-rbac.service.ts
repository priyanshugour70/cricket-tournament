import type { SystemRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";

const ALL_ROLES: SystemRole[] = ["SUPER_ADMIN", "ADMIN", "USER", "PLAYER"];

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object") return payload as Record<string, unknown>;
  return {};
}

export async function getRbacMatrix() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { key: "asc" },
      select: { id: true, key: true, label: true, description: true },
    });

    const grants = await prisma.systemRolePermission.findMany({
      select: { systemRole: true, permissionId: true },
    });

    const matrix: Record<string, SystemRole[]> = {};
    for (const p of permissions) {
      matrix[p.key] = [];
    }
    for (const g of grants) {
      const perm = permissions.find((p) => p.id === g.permissionId);
      if (perm && matrix[perm.key]) {
        matrix[perm.key].push(g.systemRole);
      }
    }

    return {
      status: 200,
      body: successResponse({
        permissions,
        matrix,
        roles: ALL_ROLES,
      }),
    };
  } catch (error) {
    return {
      status: 500,
      body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load RBAC")),
    };
  }
}

export async function putRbacMatrix(payload: unknown) {
  try {
    const body = asRecord(payload);
    const matrixRaw = body.matrix;
    if (!matrixRaw || typeof matrixRaw !== "object") {
      return {
        status: 400,
        body: errorResponse(ErrorCodes.VALIDATION_ERROR, "matrix object required (permissionKey -> SystemRole[])"),
      };
    }

    const matrix = matrixRaw as Record<string, unknown>;

    await prisma.$transaction(async (tx) => {
      await tx.systemRolePermission.deleteMany({});

      const perms = await tx.permission.findMany({ select: { id: true, key: true } });
      const keyToId = new Map(perms.map((p) => [p.key, p.id]));

      for (const [key, rolesUnknown] of Object.entries(matrix)) {
        const permissionId = keyToId.get(key);
        if (!permissionId) continue;
        const roles = Array.isArray(rolesUnknown) ? rolesUnknown : [];
        for (const r of roles) {
          if (typeof r !== "string") continue;
          if (!ALL_ROLES.includes(r as SystemRole)) continue;
          await tx.systemRolePermission.create({
            data: {
              systemRole: r as SystemRole,
              permissionId,
            },
          });
        }
      }
    });

    return getRbacMatrix();
  } catch (error) {
    return {
      status: 500,
      body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to save RBAC")),
    };
  }
}
