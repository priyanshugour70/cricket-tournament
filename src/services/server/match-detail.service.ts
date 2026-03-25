import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ErrorCodes, errorResponse, getErrorMessage, successResponse } from "@/types";
import type { MatchDetail, PlayingXIItem } from "@/types/api/matches";

function asRecord(p: unknown): Record<string, unknown> {
  return p && typeof p === "object" ? (p as Record<string, unknown>) : {};
}
function safeString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}
function safeNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) { const n = Number(v); if (Number.isFinite(n)) return n; }
  return undefined;
}

function decStr(v: Prisma.Decimal | null | undefined): string | null {
  return v ? v.toString() : null;
}

export async function getMatchDetail(matchId: string) {
  try {
    const m = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { select: { id: true, name: true, code: true } },
        awayTeam: { select: { id: true, name: true, code: true } },
        winningTeam: { select: { id: true, name: true } },
      },
    });
    if (!m) return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Match not found") };

    const detail: MatchDetail = {
      id: m.id,
      tournamentId: m.tournamentId,
      matchNo: m.matchNo,
      stage: m.stage,
      groupName: m.groupName,
      homeTeamId: m.homeTeamId,
      homeTeamName: m.homeTeam.name,
      homeTeamCode: m.homeTeam.code,
      awayTeamId: m.awayTeamId,
      awayTeamName: m.awayTeam.name,
      awayTeamCode: m.awayTeam.code,
      venueName: m.venueName,
      city: m.city,
      scheduledAt: m.scheduledAt?.toISOString() ?? null,
      startedAt: m.startedAt?.toISOString() ?? null,
      completedAt: m.completedAt?.toISOString() ?? null,
      tossWonByTeamId: m.tossWonByTeamId,
      tossDecision: m.tossDecision,
      status: m.status,
      winningTeamId: m.winningTeamId,
      resultType: m.resultType,
      resultSummary: m.resultSummary,
      winMarginRuns: m.winMarginRuns,
      winMarginWickets: m.winMarginWickets,
      pointsHome: decStr(m.pointsHome),
      pointsAway: decStr(m.pointsAway),
      oversPerSide: m.oversPerSide.toString(),
      umpire1: m.umpire1,
      umpire2: m.umpire2,
      thirdUmpire: m.thirdUmpire,
      referee: m.referee,
      highlights: m.highlights,
      createdAt: m.createdAt.toISOString(),
    };
    return { status: 200, body: successResponse(detail) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load match")) };
  }
}

export async function updateMatch(matchId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const data: Record<string, unknown> = {};
    const strFields = ["venueName", "city", "umpire1", "umpire2", "thirdUmpire", "referee", "highlights", "resultSummary", "groupName"] as const;
    for (const k of strFields) { const v = safeString(body[k]); if (v !== undefined) data[k] = v; }
    if (body.status && typeof body.status === "string") data.status = body.status;
    if (body.stage && typeof body.stage === "string") data.stage = body.stage;
    if (body.tossWonByTeamId && typeof body.tossWonByTeamId === "string") data.tossWonByTeamId = body.tossWonByTeamId;
    if (body.tossDecision && typeof body.tossDecision === "string") data.tossDecision = body.tossDecision;
    if (body.resultType && typeof body.resultType === "string") data.resultType = body.resultType;
    if (safeString(body.winningTeamId)) data.winningTeamId = body.winningTeamId;
    const numFields = ["winMarginRuns", "winMarginWickets", "matchNo"] as const;
    for (const k of numFields) { const v = safeNumber(body[k]); if (v !== undefined) data[k] = v; }
    if (safeNumber(body.pointsHome) !== undefined) data.pointsHome = safeNumber(body.pointsHome);
    if (safeNumber(body.pointsAway) !== undefined) data.pointsAway = safeNumber(body.pointsAway);
    if (body.scheduledAt && typeof body.scheduledAt === "string") { const d = new Date(body.scheduledAt); if (!isNaN(d.getTime())) data.scheduledAt = d; }
    if (body.status === "LIVE" && !data.startedAt) data.startedAt = new Date();
    if (body.status === "COMPLETED" && !data.completedAt) data.completedAt = new Date();

    const m = await prisma.match.findUnique({ where: { id: matchId } });
    if (!m) return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Match not found") };

    await prisma.match.update({ where: { id: matchId }, data });
    return getMatchDetail(matchId);
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to update match")) };
  }
}

export async function getPlayingXI(matchId: string) {
  try {
    const rows = await prisma.matchPlayingXI.findMany({
      where: { matchId },
      orderBy: [{ teamId: "asc" }, { slotNo: "asc" }],
    });
    const playerIds = rows.map(r => r.playerId);
    const players = await prisma.player.findMany({ where: { id: { in: playerIds } }, select: { id: true, displayName: true } });
    const pMap = new Map(players.map(p => [p.id, p.displayName]));

    const items: PlayingXIItem[] = rows.map(r => ({
      id: r.id,
      matchId: r.matchId,
      teamId: r.teamId,
      playerId: r.playerId,
      playerName: pMap.get(r.playerId) ?? "Unknown",
      slotNo: r.slotNo,
      role: r.role,
      isCaptain: r.isCaptain,
      isViceCaptain: r.isViceCaptain,
      isWicketKeeper: r.isWicketKeeper,
    }));
    return { status: 200, body: successResponse(items) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load playing XI")) };
  }
}

export async function setPlayingXI(matchId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const teamId = safeString(body.teamId);
    const players = Array.isArray(body.players) ? body.players : [];
    if (!teamId || players.length !== 11) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "teamId and exactly 11 players are required") };
    }

    await prisma.$transaction(async (tx) => {
      await tx.matchPlayingXI.deleteMany({ where: { matchId, teamId } });
      for (const p of players) {
        const rec = asRecord(p);
        await tx.matchPlayingXI.create({
          data: {
            matchId,
            teamId,
            playerId: String(rec.playerId ?? ""),
            slotNo: Number(rec.slotNo ?? 0),
            role: safeString(rec.role),
            isCaptain: Boolean(rec.isCaptain),
            isViceCaptain: Boolean(rec.isViceCaptain),
            isWicketKeeper: Boolean(rec.isWicketKeeper),
          },
        });
      }
    });

    return getPlayingXI(matchId);
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to set playing XI")) };
  }
}
