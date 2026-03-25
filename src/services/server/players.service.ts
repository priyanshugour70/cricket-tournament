import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";
import type {
  CreatePlayerRequest,
  PlayerCareer,
  PlayerCareerBallItem,
  PlayerCareerMatchItem,
  PlayerDetail,
  PlayerListItem,
  UpdatePlayerRequest,
} from "@/types/api/players";

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
function safeBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  return undefined;
}

function decimalToString(v: Prisma.Decimal | null | undefined): string | null {
  if (!v) return null;
  return v.toString();
}

function mapPlayerListItem(p: {
  id: string; code: string | null; displayName: string; role: PlayerListItem["role"];
  battingStyle: PlayerListItem["battingStyle"]; bowlingStyle: PlayerListItem["bowlingStyle"];
  isOverseas: boolean; isCapped: boolean; nationality: string | null;
  active: boolean; createdAt: Date;
}): PlayerListItem {
  return {
    id: p.id,
    code: p.code,
    displayName: p.displayName,
    role: p.role,
    battingStyle: p.battingStyle,
    bowlingStyle: p.bowlingStyle,
    isOverseas: p.isOverseas,
    isCapped: p.isCapped,
    nationality: p.nationality,
    active: p.active,
    createdAt: p.createdAt.toISOString(),
  };
}

function mapPlayerDetail(p: {
  id: string; code: string | null; firstName: string; lastName: string | null;
  displayName: string; dateOfBirth: Date | null; age: number | null; gender: string | null;
  nationality: string | null; state: string | null; city: string | null;
  role: PlayerDetail["role"]; battingStyle: PlayerDetail["battingStyle"];
  bowlingStyle: PlayerDetail["bowlingStyle"]; isOverseas: boolean; isWicketKeeper: boolean;
  isCapped: boolean; t20Matches: number; odiMatches: number; testMatches: number;
  battingRating: number; bowlingRating: number; fieldingRating: number; allRounderRating: number;
  reservePrice: Prisma.Decimal | null; basePrice: Prisma.Decimal | null;
  profilePhotoUrl: string | null; bio: string | null; email: string | null; phone: string | null;
  active: boolean; createdAt: Date;
}): PlayerDetail {
  return {
    ...mapPlayerListItem(p),
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth?.toISOString() ?? null,
    age: p.age,
    gender: p.gender,
    state: p.state,
    city: p.city,
    isWicketKeeper: p.isWicketKeeper,
    t20Matches: p.t20Matches,
    odiMatches: p.odiMatches,
    testMatches: p.testMatches,
    battingRating: p.battingRating,
    bowlingRating: p.bowlingRating,
    fieldingRating: p.fieldingRating,
    allRounderRating: p.allRounderRating,
    reservePrice: decimalToString(p.reservePrice),
    basePrice: decimalToString(p.basePrice),
    profilePhotoUrl: p.profilePhotoUrl,
    bio: p.bio,
    email: p.email,
    phone: p.phone,
  };
}

export async function listPlayers(filters?: { role?: string; nationality?: string; active?: boolean }) {
  try {
    const where: Prisma.PlayerWhereInput = {};
    if (filters?.role) where.role = filters.role as PlayerListItem["role"];
    if (filters?.nationality) where.nationality = filters.nationality;
    if (filters?.active !== undefined) where.active = filters.active;

    const players = await prisma.player.findMany({
      where,
      orderBy: [{ displayName: "asc" }],
    });
    return { status: 200, body: successResponse(players.map(mapPlayerListItem)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load players")) };
  }
}

export async function getPlayerById(id: string) {
  try {
    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Player not found") };
    }
    return { status: 200, body: successResponse(mapPlayerDetail(player)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to fetch player")) };
  }
}

export async function createPlayer(payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: CreatePlayerRequest = {
      firstName: safeString(body.firstName) ?? "",
      lastName: safeString(body.lastName),
      displayName: safeString(body.displayName) ?? "",
      role: body.role as CreatePlayerRequest["role"],
      battingStyle: body.battingStyle as CreatePlayerRequest["battingStyle"],
      bowlingStyle: body.bowlingStyle as CreatePlayerRequest["bowlingStyle"],
      isOverseas: safeBool(body.isOverseas),
      isWicketKeeper: safeBool(body.isWicketKeeper),
      isCapped: safeBool(body.isCapped),
      nationality: safeString(body.nationality),
      state: safeString(body.state),
      city: safeString(body.city),
      reservePrice: safeNumber(body.reservePrice),
      basePrice: safeNumber(body.basePrice),
      email: safeString(body.email),
      phone: safeString(body.phone),
      bio: safeString(body.bio),
    };

    if (!request.firstName || !request.displayName || !request.role) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "firstName, displayName and role are required") };
    }

    const created = await prisma.player.create({
      data: {
        firstName: request.firstName,
        lastName: request.lastName,
        displayName: request.displayName,
        role: request.role,
        battingStyle: request.battingStyle,
        bowlingStyle: request.bowlingStyle,
        isOverseas: request.isOverseas,
        isWicketKeeper: request.isWicketKeeper,
        isCapped: request.isCapped,
        nationality: request.nationality,
        state: request.state,
        city: request.city,
        reservePrice: request.reservePrice,
        basePrice: request.basePrice,
        email: request.email,
        phone: request.phone,
        bio: request.bio,
      },
    });
    return { status: 201, body: successResponse(mapPlayerDetail(created), "Player created successfully") };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "A player with this code already exists") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to create player")) };
  }
}

export async function updatePlayer(id: string, payload: unknown) {
  try {
    const existing = await prisma.player.findUnique({ where: { id } });
    if (!existing) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Player not found") };
    }

    const body = asRecord(payload);
    const request: UpdatePlayerRequest = {
      firstName: safeString(body.firstName),
      lastName: safeString(body.lastName),
      displayName: safeString(body.displayName),
      role: body.role as UpdatePlayerRequest["role"],
      battingStyle: body.battingStyle as UpdatePlayerRequest["battingStyle"],
      bowlingStyle: body.bowlingStyle as UpdatePlayerRequest["bowlingStyle"],
      isOverseas: safeBool(body.isOverseas),
      isWicketKeeper: safeBool(body.isWicketKeeper),
      isCapped: safeBool(body.isCapped),
      nationality: safeString(body.nationality),
      state: safeString(body.state),
      city: safeString(body.city),
      reservePrice: safeNumber(body.reservePrice),
      basePrice: safeNumber(body.basePrice),
      email: safeString(body.email),
      phone: safeString(body.phone),
      bio: safeString(body.bio),
      active: safeBool(body.active),
    };

    const updated = await prisma.player.update({
      where: { id },
      data: {
        firstName: request.firstName,
        lastName: request.lastName,
        displayName: request.displayName,
        role: request.role,
        battingStyle: request.battingStyle,
        bowlingStyle: request.bowlingStyle,
        isOverseas: request.isOverseas,
        isWicketKeeper: request.isWicketKeeper,
        isCapped: request.isCapped,
        nationality: request.nationality,
        state: request.state,
        city: request.city,
        reservePrice: request.reservePrice,
        basePrice: request.basePrice,
        email: request.email,
        phone: request.phone,
        bio: request.bio,
        active: request.active,
      },
    });
    return { status: 200, body: successResponse(mapPlayerDetail(updated), "Player updated successfully") };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "A player with this code already exists") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to update player")) };
  }
}

export async function getPlayerCareer(playerId: string) {
  try {
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    if (!player) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Player not found") };
    }

    const batBalls = await prisma.ballByBall.findMany({
      where: { batsmanId: playerId },
      select: {
        runs: true,
        isFour: true,
        isSix: true,
        isExtra: true,
        bowlerId: true,
        createdAt: true,
        overNo: true,
        ballNo: true,
        id: true,
        totalRuns: true,
        isWicket: true,
        extraType: true,
        dismissedId: true,
        innings: {
          select: {
            inningsNo: true,
            match: {
              select: {
                id: true,
                matchNo: true,
                homeTeam: { select: { name: true } },
                awayTeam: { select: { name: true } },
                tournament: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
    });

    const bowlBalls = await prisma.ballByBall.findMany({
      where: { bowlerId: playerId },
      select: {
        runs: true,
        isWicket: true,
        isExtra: true,
        createdAt: true,
        overNo: true,
        ballNo: true,
        id: true,
        totalRuns: true,
        isFour: true,
        isSix: true,
        extraType: true,
        bowlerId: true,
        batsmanId: true,
        dismissedId: true,
        innings: {
          select: {
            inningsNo: true,
            match: {
              select: {
                id: true,
                matchNo: true,
                homeTeam: { select: { name: true } },
                awayTeam: { select: { name: true } },
                tournament: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 50,
    });

    const dismissals = await prisma.ballByBall.count({
      where: { dismissedId: playerId, isWicket: true },
    });

    const allBat = await prisma.ballByBall.findMany({
      where: { batsmanId: playerId },
      select: { runs: true, isFour: true, isSix: true, isExtra: true, extraType: true },
    });

    const runsOffBat = allBat.reduce((s, b) => s + b.runs, 0);
    const fours = allBat.filter((b) => b.isFour).length;
    const sixes = allBat.filter((b) => b.isSix).length;
    // #21: Exclude illegal deliveries (wides/no-balls) from balls faced
    const ballsAsBatsman = allBat.filter(
      (b) => !b.isExtra || (b.extraType !== "WIDE" && b.extraType !== "NO_BALL"),
    ).length;

    const allBowl = await prisma.ballByBall.findMany({
      where: { bowlerId: playerId },
      select: { runs: true, isWicket: true, isExtra: true, dismissalType: true },
    });
    // #11: Exclude non-bowler dismissals (run-outs, retired, obstructing, timed-out, handled-ball) from bowler wickets
    const NON_BOWLER_DISMISSALS = new Set(["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING_FIELD", "TIMED_OUT", "HANDLED_BALL"]);
    const wicketsAsBowler = allBowl.filter(
      (b) => b.isWicket && !NON_BOWLER_DISMISSALS.has(b.dismissalType ?? ""),
    ).length;
    const ballsAsBowler = allBowl.length;
    const runsConcededOffBat = allBowl.reduce((s, b) => s + b.runs, 0);

    const squads = await prisma.teamSquadPlayer.count({
      where: { playerId, isActive: true },
    });

    const squadRows = await prisma.teamSquadPlayer.findMany({
      where: { playerId, isActive: true },
      select: { teamId: true },
    });
    const teamIds = [...new Set(squadRows.map((r) => r.teamId))];

    const matches =
      teamIds.length > 0
        ? await prisma.match.findMany({
            where: {
              OR: [{ homeTeamId: { in: teamIds } }, { awayTeamId: { in: teamIds } }],
            },
            orderBy: [{ scheduledAt: "desc" }],
            take: 25,
            include: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
              tournament: { select: { name: true } },
            },
          })
        : [];

    const recentMatches: PlayerCareerMatchItem[] = matches.map((m) => ({
      matchId: m.id,
      tournamentName: m.tournament.name,
      matchNo: m.matchNo,
      homeTeamName: m.homeTeam.name,
      awayTeamName: m.awayTeam.name,
      status: m.status,
      resultSummary: m.resultSummary,
      scheduledAt: m.scheduledAt?.toISOString() ?? null,
    }));

    type CareerBallRow = (typeof batBalls)[number];
    const mapBall = (
      b: CareerBallRow,
      involvement: PlayerCareerBallItem["involvement"],
    ): PlayerCareerBallItem => ({
      id: b.id,
      matchId: b.innings.match.id,
      tournamentName: b.innings.match.tournament.name,
      homeTeamName: b.innings.match.homeTeam.name,
      awayTeamName: b.innings.match.awayTeam.name,
      inningsNo: b.innings.inningsNo,
      overNo: b.overNo,
      ballNo: b.ballNo,
      involvement,
      runs: b.runs,
      totalRuns: b.totalRuns,
      isWicket: b.isWicket,
      isFour: b.isFour,
      isSix: b.isSix,
      extraType: b.extraType,
      createdAt: b.createdAt.toISOString(),
    });

    const merged: PlayerCareerBallItem[] = [];
    const seen = new Set<string>();
    for (const b of batBalls) {
      if (seen.has(b.id)) continue;
      seen.add(b.id);
      merged.push(mapBall(b, "batsman"));
    }
    for (const b of bowlBalls) {
      if (seen.has(b.id)) continue;
      seen.add(b.id);
      merged.push(mapBall(b, "bowler"));
    }
    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const career: PlayerCareer = {
      playerId: player.id,
      displayName: player.displayName,
      runsOffBat,
      ballsAsBatsman,
      dismissalsAsBatsman: dismissals,
      wicketsAsBowler,
      runsConcededOffBat,
      ballsAsBowler,
      fours,
      sixes,
      squadAssignments: squads,
      recentMatches,
      recentBallInvolvement: merged.slice(0, 40),
    };

    return { status: 200, body: successResponse(career) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load career")) };
  }
}
