import { prisma } from "@/lib/prisma";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";

export async function listSquadPlayers(tournamentId: string) {
  try {
    const squadPlayers = await prisma.teamSquadPlayer.findMany({
      where: { tournamentId },
      orderBy: [{ teamId: "asc" }, { joinedAt: "asc" }],
      include: {
        team: { select: { name: true, code: true } },
        player: { select: { displayName: true, role: true, isOverseas: true } },
      },
    });

    const data = squadPlayers.map((sp) => ({
      id: sp.id,
      tournamentId: sp.tournamentId,
      teamId: sp.teamId,
      teamName: sp.team.name,
      teamCode: sp.team.code,
      playerId: sp.playerId,
      playerName: sp.player.displayName,
      playerRole: sp.player.role,
      acquisitionType: sp.acquisitionType,
      acquisitionAmount: sp.acquisitionAmount?.toString() ?? null,
      jerseyNumber: sp.jerseyNumber,
      isCaptain: sp.isCaptain,
      isViceCaptain: sp.isViceCaptain,
      isOverseas: sp.isOverseas,
      isActive: sp.isActive,
      joinedAt: sp.joinedAt.toISOString(),
    }));

    return { status: 200, body: successResponse(data) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load squad players")) };
  }
}
