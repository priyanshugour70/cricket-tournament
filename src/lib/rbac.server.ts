import type { SystemRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const LEGACY_SUPER_ADMIN_KEYS = [
  "admin.access",
  "admin.users.read",
  "admin.users.write",
  "admin.rbac.manage",
] as const;
const LEGACY_ADMIN_KEYS = ["admin.access", "admin.users.read", "admin.users.write"] as const;

/** All permission keys granted to a system role (from SystemRolePermission; DB is source of truth). */
export async function getPermissionKeysForRole(role: SystemRole): Promise<string[]> {
  const permCount = await prisma.permission.count();
  if (permCount === 0) {
    if (role === "SUPER_ADMIN") return [...LEGACY_SUPER_ADMIN_KEYS];
    if (role === "ADMIN") return [...LEGACY_ADMIN_KEYS];
    return [];
  }

  const rows = await prisma.systemRolePermission.findMany({
    where: { systemRole: role },
    select: { permission: { select: { key: true } } },
  });
  return rows.map((r) => r.permission.key);
}

export async function userHasPermission(userId: string, permissionKey: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { systemRole: true, isActive: true },
  });
  if (!user?.isActive) return false;
  const keys = await getPermissionKeysForRole(user.systemRole);
  return keys.includes(permissionKey);
}
