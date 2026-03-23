import { prisma } from "@/lib/prisma";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";

export async function listEmailLogs(tournamentId: string) {
  try {
    const logs = await prisma.emailLog.findMany({
      where: { tournamentId },
      orderBy: [{ createdAt: "desc" }],
    });

    const data = logs.map((log) => ({
      id: log.id,
      to: log.to,
      subject: log.subject,
      status: log.status,
      error: log.error,
      createdAt: log.createdAt.toISOString(),
    }));

    return { status: 200, body: successResponse(data) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load email logs")) };
  }
}
