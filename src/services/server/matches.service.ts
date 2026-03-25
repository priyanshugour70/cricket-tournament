import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";
import type {
  CreateMatchRequest,
  MatchListItem,
  UpdateMatchResultRequest,
} from "@/types/api/matches";
import { recalculatePointsTable } from "./points-table.service";

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object") return payload as Record<string, unknown>;
  return {};
}
function safeString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}
function safeNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}
function safeDate(v: unknown): Date | undefined {
  if (typeof v !== "string" || !v.trim()) return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function mapMatchListItem(item: {
  id: string;
  tournamentId: string;
  matchNo: number;
  stage: MatchListItem["stage"];
  groupName: string | null;
  homeTeamId: string;
  awayTeamId: string;
  venueName: string | null;
  city: string | null;
  scheduledAt: Date | null;
  status: MatchListItem["status"];
  winningTeamId: string | null;
  resultType: MatchListItem["resultType"];
  resultSummary: string | null;
  createdAt: Date;
  homeTeam: { name: string };
  awayTeam: { name: string };
}): MatchListItem {
  return {
    id: item.id,
    tournamentId: item.tournamentId,
    matchNo: item.matchNo,
    stage: item.stage,
    groupName: item.groupName,
    homeTeamId: item.homeTeamId,
    homeTeamName: item.homeTeam.name,
    awayTeamId: item.awayTeamId,
    awayTeamName: item.awayTeam.name,
    venueName: item.venueName,
    city: item.city,
    scheduledAt: item.scheduledAt?.toISOString() ?? null,
    status: item.status,
    winningTeamId: item.winningTeamId,
    resultType: item.resultType,
    resultSummary: item.resultSummary,
    createdAt: item.createdAt.toISOString(),
  };
}

const matchInclude = {
  homeTeam: { select: { name: true } },
  awayTeam: { select: { name: true } },
} as const;

export async function listTournamentMatches(tournamentId: string) {
  try {
    const matches = await prisma.match.findMany({
      where: { tournamentId },
      orderBy: [{ matchNo: "asc" }],
      include: matchInclude,
    });
    return { status: 200, body: successResponse(matches.map(mapMatchListItem)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load matches")) };
  }
}

export async function createTournamentMatch(tournamentId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: CreateMatchRequest = {
      matchNo: safeNumber(body.matchNo) ?? 0,
      stage: body.stage as CreateMatchRequest["stage"],
      groupName: safeString(body.groupName),
      homeTeamId: safeString(body.homeTeamId) ?? "",
      awayTeamId: safeString(body.awayTeamId) ?? "",
      venueName: safeString(body.venueName),
      city: safeString(body.city),
      scheduledAt: safeString(body.scheduledAt),
      oversPerSide: safeNumber(body.oversPerSide),
      umpire1: safeString(body.umpire1),
      umpire2: safeString(body.umpire2),
      thirdUmpire: safeString(body.thirdUmpire),
      referee: safeString(body.referee),
    };

    if (!request.matchNo || !request.homeTeamId || !request.awayTeamId) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "matchNo, homeTeamId and awayTeamId are required") };
    }
    if (request.homeTeamId === request.awayTeamId) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "homeTeamId and awayTeamId must be different") };
    }

    const [homeTeam, awayTeam] = await Promise.all([
      prisma.team.findFirst({ where: { id: request.homeTeamId, tournamentId } }),
      prisma.team.findFirst({ where: { id: request.awayTeamId, tournamentId } }),
    ]);
    if (!homeTeam) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Home team not found in this tournament") };
    }
    if (!awayTeam) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Away team not found in this tournament") };
    }

    const created = await prisma.match.create({
      data: {
        tournamentId,
        matchNo: request.matchNo,
        stage: request.stage,
        groupName: request.groupName,
        homeTeamId: request.homeTeamId,
        awayTeamId: request.awayTeamId,
        venueName: request.venueName,
        city: request.city,
        scheduledAt: safeDate(request.scheduledAt),
        oversPerSide: request.oversPerSide,
        umpire1: request.umpire1,
        umpire2: request.umpire2,
        thirdUmpire: request.thirdUmpire,
        referee: request.referee,
      },
      include: matchInclude,
    });
    return { status: 201, body: successResponse(mapMatchListItem(created), "Match created successfully") };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "A match with this number already exists in the tournament") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to create match")) };
  }
}

export async function updateMatchResult(tournamentId: string, matchId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: UpdateMatchResultRequest = {
      status: body.status as UpdateMatchResultRequest["status"],
      resultType: body.resultType as UpdateMatchResultRequest["resultType"],
      winningTeamId: safeString(body.winningTeamId),
      resultSummary: safeString(body.resultSummary),
      winMarginRuns: safeNumber(body.winMarginRuns),
      winMarginWickets: safeNumber(body.winMarginWickets),
      tossWonByTeamId: safeString(body.tossWonByTeamId),
      tossDecision: body.tossDecision as UpdateMatchResultRequest["tossDecision"],
      pointsHome: safeNumber(body.pointsHome),
      pointsAway: safeNumber(body.pointsAway),
    };

    const existing = await prisma.match.findFirst({
      where: { id: matchId, tournamentId },
    });
    if (!existing) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Match not found in this tournament") };
    }

    // #37: Validate winningTeamId belongs to the match
    if (request.winningTeamId && request.winningTeamId !== existing.homeTeamId && request.winningTeamId !== existing.awayTeamId) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "winningTeamId must be one of the match's teams") };
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: request.status,
        resultType: request.resultType,
        winningTeamId: request.winningTeamId,
        resultSummary: request.resultSummary,
        winMarginRuns: request.winMarginRuns,
        winMarginWickets: request.winMarginWickets,
        tossWonByTeamId: request.tossWonByTeamId,
        tossDecision: request.tossDecision,
        pointsHome: request.pointsHome,
        pointsAway: request.pointsAway,
        completedAt: request.status === "COMPLETED" ? new Date() : undefined,
      },
      include: matchInclude,
    });

    // #20: Auto-recalculate points table when match is completed
    if (request.status === "COMPLETED") {
      recalculatePointsTable(tournamentId).catch(() => {});
    }

    return { status: 200, body: successResponse(mapMatchListItem(updated), "Match result updated") };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to update match result")) };
  }
}
