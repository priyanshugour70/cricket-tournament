import type { SystemRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const LEGACY_SUPER_ADMIN_KEYS = [
  "admin.access",
  "admin.users.read",
  "admin.users.write",
  "admin.rbac.manage",
] as const;
const LEGACY_ADMIN_KEYS = ["admin.access", "admin.users.read", "admin.users.write"] as const;

const CACHE_TTL_MS = 60_000;
const roleCache = new Map<string, { keys: string[]; expiresAt: number }>();

export function invalidateRbacCache() {
  roleCache.clear();
}

/** All permission keys granted to a system role (from SystemRolePermission; DB is source of truth). */
export async function getPermissionKeysForRole(role: SystemRole): Promise<string[]> {
  const cached = roleCache.get(role);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.keys;
  }

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
  const keys = rows.map((r) => r.permission.key);

  roleCache.set(role, { keys, expiresAt: Date.now() + CACHE_TTL_MS });

  return keys;
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
