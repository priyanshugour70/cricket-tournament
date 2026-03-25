import { getSessionFromRequest } from "@/lib/auth";
import { userHasPermission } from "@/lib/rbac.server";
import { ErrorCodes, errorResponse } from "@/types";

export async function requirePermission(req: Request, permissionKey: string) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return {
      ok: false as const,
      status: 401 as const,
      body: errorResponse(ErrorCodes.UNAUTHORIZED, "Not authenticated"),
    };
  }
  const allowed = await userHasPermission(session.userId, permissionKey);
  if (!allowed) {
    return {
      ok: false as const,
      status: 403 as const,
      body: errorResponse(ErrorCodes.FORBIDDEN, "Insufficient permissions"),
    };
  }
  return { ok: true as const, session };
}
