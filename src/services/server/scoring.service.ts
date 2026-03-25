import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";
import type {
  AddBallRequest,
  AddCommentaryRequest,
  BallItem,
  CommentaryItem,
  InningsItem,
} from "@/types/api/scoring";

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

const VALID_EXTRA_TYPES = new Set(["WIDE", "NO_BALL", "BYE", "LEG_BYE", "PENALTY"]);
const VALID_DISMISSAL_TYPES = new Set([
  "BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED", "HIT_WICKET",
  "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING_FIELD", "TIMED_OUT", "HANDLED_BALL",
]);
const NON_BOWLER_DISMISSALS = new Set(["RUN_OUT", "RETIRED_HURT", "RETIRED_OUT", "OBSTRUCTING_FIELD", "TIMED_OUT", "HANDLED_BALL"]);

function mapInningsItem(item: {
  id: string;
  matchId: string;
  inningsNo: number;
  battingTeamId: string;
  bowlingTeamId: string;
  status: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: Prisma.Decimal;
  extras: number;
  runRate: Prisma.Decimal;
  targetScore: number | null;
  battingTeam: { name: string };
  bowlingTeam: { name: string };
}): InningsItem {
  return {
    id: item.id,
    matchId: item.matchId,
    inningsNo: item.inningsNo,
    battingTeamId: item.battingTeamId,
    battingTeamName: item.battingTeam.name,
    bowlingTeamId: item.bowlingTeamId,
    bowlingTeamName: item.bowlingTeam.name,
    status: item.status,
    totalRuns: item.totalRuns,
    totalWickets: item.totalWickets,
    totalOvers: item.totalOvers.toString(),
    extras: item.extras,
    runRate: item.runRate.toString(),
    targetScore: item.targetScore,
  };
}

function mapBallItem(item: {
  id: string;
  overNo: number;
  ballNo: number;
  batsmanId: string;
  bowlerId: string;
  runs: number;
  totalRuns: number;
  isExtra: boolean;
  extraType: string | null;
  isWicket: boolean;
  dismissalType: string | null;
  isFour: boolean;
  isSix: boolean;
}): BallItem {
  return {
    id: item.id,
    overNo: item.overNo,
    ballNo: item.ballNo,
    batsmanId: item.batsmanId,
    bowlerId: item.bowlerId,
    runs: item.runs,
    totalRuns: item.totalRuns,
    isExtra: item.isExtra,
    extraType: item.extraType,
    isWicket: item.isWicket,
    dismissalType: item.dismissalType,
    isFour: item.isFour,
    isSix: item.isSix,
  };
}

function mapCommentaryItem(item: {
  id: string;
  overNo: number;
  ballNo: number | null;
  text: string;
  isHighlight: boolean;
  createdAt: Date;
}): CommentaryItem {
  return {
    id: item.id,
    overNo: item.overNo,
    ballNo: item.ballNo,
    text: item.text,
    isHighlight: item.isHighlight,
    createdAt: item.createdAt.toISOString(),
  };
}

async function getTournamentSettingsForMatch(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: { tournamentId: true, oversPerSide: true },
  });
  if (!match) return null;

  const settings = await prisma.tournamentSettings.findUnique({
    where: { tournamentId: match.tournamentId },
  });

  return {
    matchOvers: Number(match.oversPerSide),
    maxOversPerBowler: settings?.maxOversPerBowler ?? 4,
    wideRunPenalty: settings?.wideRunPenalty ?? 1,
    noBallRunPenalty: settings?.noBallRunPenalty ?? 1,
    freeHitOnNoBall: settings?.freeHitOnNoBall ?? true,
    powerplayEnd: settings?.powerplayEnd ?? 6,
  };
}

export async function listInnings(matchId: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        innings: {
          orderBy: [{ inningsNo: "asc" }],
        },
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
      },
    });
    if (!match) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Match not found") };
    }

    const items = match.innings.map((inn) => mapInningsItem({
      ...inn,
      battingTeam: inn.battingTeamId === match.homeTeam.id ? match.homeTeam : match.awayTeam,
      bowlingTeam: inn.bowlingTeamId === match.homeTeam.id ? match.homeTeam : match.awayTeam,
    }));

    return { status: 200, body: successResponse(items) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load innings")) };
  }
}

export async function createInnings(matchId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const inningsNo = safeNumber(body.inningsNo) ?? 0;
    const battingTeamId = safeString(body.battingTeamId) ?? "";
    const bowlingTeamId = safeString(body.bowlingTeamId) ?? "";

    if (!inningsNo || !battingTeamId || !bowlingTeamId) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "inningsNo, battingTeamId and bowlingTeamId are required") };
    }
    if (battingTeamId === bowlingTeamId) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "battingTeamId and bowlingTeamId must be different") };
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
      },
    });
    if (!match) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Match not found") };
    }

    // #19: Validate team IDs belong to this match
    const validTeamIds = new Set([match.homeTeam.id, match.awayTeam.id]);
    if (!validTeamIds.has(battingTeamId)) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "battingTeamId does not belong to this match") };
    }
    if (!validTeamIds.has(bowlingTeamId)) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "bowlingTeamId does not belong to this match") };
    }

    const created = await prisma.innings.create({
      data: { matchId, inningsNo, battingTeamId, bowlingTeamId },
    });

    const battingTeam = battingTeamId === match.homeTeam.id ? match.homeTeam : match.awayTeam;
    const bowlingTeam = bowlingTeamId === match.homeTeam.id ? match.homeTeam : match.awayTeam;

    return {
      status: 201,
      body: successResponse(
        mapInningsItem({ ...created, battingTeam, bowlingTeam }),
        "Innings created",
      ),
    };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "This innings number already exists for this match") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to create innings")) };
  }
}

export async function addBall(inningsId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: AddBallRequest = {
      overNo: safeNumber(body.overNo) ?? -1,
      ballNo: safeNumber(body.ballNo) ?? 0,
      batsmanId: safeString(body.batsmanId) ?? "",
      bowlerId: safeString(body.bowlerId) ?? "",
      nonStrikerId: safeString(body.nonStrikerId),
      runs: safeNumber(body.runs) ?? 0,
      isExtra: Boolean(body.isExtra),
      extraType: safeString(body.extraType),
      extraRuns: safeNumber(body.extraRuns) ?? 0,
      isWicket: Boolean(body.isWicket),
      dismissalType: safeString(body.dismissalType),
      dismissedId: safeString(body.dismissedId),
      fielderId: safeString(body.fielderId),
      isFour: Boolean(body.isFour),
      isSix: Boolean(body.isSix),
      isFreeHit: Boolean(body.isFreeHit),
      commentaryNote: safeString(body.commentaryNote),
      skipAutoCommentary: Boolean(body.skipAutoCommentary),
    };

    // #15: Allow overNo >= 0 (over 0 is the first over) and validate ballNo 1-10
    if (request.overNo < 0 || !request.batsmanId || !request.bowlerId) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "overNo (>=0), batsmanId and bowlerId are required") };
    }
    if (request.ballNo < 1 || request.ballNo > 10) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "ballNo must be between 1 and 10") };
    }

    // #14: Validate extraType enum and extra combinations
    if (request.isExtra) {
      if (!request.extraType || !VALID_EXTRA_TYPES.has(request.extraType)) {
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid extraType. Must be one of: WIDE, NO_BALL, BYE, LEG_BYE, PENALTY") };
      }
      if ((request.extraRuns ?? 0) < 0) {
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "extraRuns cannot be negative") };
      }
      if ((request.extraType === "WIDE" || request.extraType === "NO_BALL") && (request.extraRuns ?? 0) > 7) {
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "extraRuns for wide/no-ball cannot exceed 7 (penalty + overthrows)") };
      }
    }

    if (request.runs < 0) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "runs cannot be negative") };
    }

    // Validate dismissalType if wicket
    if (request.isWicket) {
      if (!request.dismissalType || !VALID_DISMISSAL_TYPES.has(request.dismissalType)) {
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Invalid dismissalType for wicket") };
      }
    }

    const innings = await prisma.innings.findUnique({
      where: { id: inningsId },
      include: { match: { select: { id: true, status: true, oversPerSide: true, tournamentId: true } } },
    });
    if (!innings) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Innings not found") };
    }

    // #17: Block scoring on completed matches or innings
    if (innings.match.status === "COMPLETED") {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Cannot add ball to a completed match") };
    }
    if (innings.status === "COMPLETED") {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Cannot add ball to a completed innings") };
    }

    // #10: Check wickets cap — cannot exceed 10
    if (request.isWicket && innings.totalWickets >= 10) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "All 10 wickets have already fallen in this innings") };
    }

    const matchOvers = Number(innings.match.oversPerSide);

    // #17: Check overs cap — innings is complete when legal balls reach matchOvers * 6
    const isLegalDelivery = !request.isExtra || (request.extraType !== "WIDE" && request.extraType !== "NO_BALL");
    if (isLegalDelivery && innings.totalBalls >= matchOvers * 6) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, `All ${matchOvers} overs have been bowled in this innings`) };
    }

    // #16: Load tournament settings for penalty calculations
    const settings = await getTournamentSettingsForMatch(innings.match.id);
    const wideRunPenalty = settings?.wideRunPenalty ?? 1;
    const noBallRunPenalty = settings?.noBallRunPenalty ?? 1;

    // #16: Check bowler overs limit
    if (settings) {
      const maxBowlerOvers = settings.maxOversPerBowler;
      const bowlerLegalBalls = await prisma.ballByBall.count({
        where: {
          inningsId,
          bowlerId: request.bowlerId,
          OR: [
            { isExtra: false },
            { extraType: { notIn: ["WIDE", "NO_BALL"] } },
          ],
        },
      });
      if (isLegalDelivery && bowlerLegalBalls >= maxBowlerOvers * 6) {
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, `This bowler has already bowled ${maxBowlerOvers} overs (max allowed)`) };
      }
    }

    // Calculate runs based on extra type with tournament settings penalties
    let ballTotalRuns = request.runs;
    let extraRunsForInnings = 0;

    if (request.isExtra) {
      switch (request.extraType) {
        case "WIDE":
          extraRunsForInnings = wideRunPenalty + (request.extraRuns ?? 0);
          ballTotalRuns = request.runs + extraRunsForInnings;
          break;
        case "NO_BALL":
          extraRunsForInnings = noBallRunPenalty + (request.extraRuns ?? 0);
          ballTotalRuns = request.runs + extraRunsForInnings;
          break;
        case "BYE":
        case "LEG_BYE":
          extraRunsForInnings = request.extraRuns ?? 0;
          ballTotalRuns = request.runs + extraRunsForInnings;
          break;
        case "PENALTY":
          extraRunsForInnings = request.extraRuns ?? 0;
          ballTotalRuns = extraRunsForInnings;
          break;
        default:
          extraRunsForInnings = request.extraRuns ?? 0;
          ballTotalRuns = request.runs + extraRunsForInnings;
      }
    }

    // #12: Dot ball = no runs AND not a wicket
    const isDot = ballTotalRuns === 0 && !request.isWicket;

    const result = await prisma.$transaction(async (tx) => {
      const ball = await tx.ballByBall.create({
        data: {
          inningsId,
          overNo: request.overNo,
          ballNo: request.ballNo,
          batsmanId: request.batsmanId,
          bowlerId: request.bowlerId,
          nonStrikerId: request.nonStrikerId,
          runs: request.runs,
          isExtra: request.isExtra ?? false,
          extraType: request.extraType as "WIDE" | "NO_BALL" | "BYE" | "LEG_BYE" | "PENALTY" | undefined,
          extraRuns: request.extraRuns ?? 0,
          totalRuns: ballTotalRuns,
          isWicket: request.isWicket ?? false,
          dismissalType: request.dismissalType as "BOWLED" | "CAUGHT" | "LBW" | "RUN_OUT" | "STUMPED" | "HIT_WICKET" | "RETIRED_HURT" | "RETIRED_OUT" | "OBSTRUCTING_FIELD" | "TIMED_OUT" | "HANDLED_BALL" | undefined,
          dismissedId: request.dismissedId,
          fielderId: request.fielderId,
          isFour: request.isFour ?? false,
          isSix: request.isSix ?? false,
          isDot,
          isFreeHit: request.isFreeHit ?? false,
        },
      });

      const currentInnings = await tx.innings.findUniqueOrThrow({ where: { id: inningsId } });
      const newTotalRuns = currentInnings.totalRuns + ballTotalRuns;
      const newTotalBalls = currentInnings.totalBalls + (isLegalDelivery ? 1 : 0);
      const newWickets = currentInnings.totalWickets + (request.isWicket ? 1 : 0);
      const newExtras = currentInnings.extras + (request.isExtra ? extraRunsForInnings : 0);

      // #13: Update per-type extras breakdown
      const extraIncrements: { wides?: number; noBalls?: number; byes?: number; legByes?: number; penalties?: number } = {};
      if (request.isExtra && request.extraType) {
        switch (request.extraType) {
          case "WIDE": extraIncrements.wides = currentInnings.wides + extraRunsForInnings; break;
          case "NO_BALL": extraIncrements.noBalls = currentInnings.noBalls + extraRunsForInnings; break;
          case "BYE": extraIncrements.byes = currentInnings.byes + extraRunsForInnings; break;
          case "LEG_BYE": extraIncrements.legByes = currentInnings.legByes + extraRunsForInnings; break;
          case "PENALTY": extraIncrements.penalties = currentInnings.penalties + extraRunsForInnings; break;
        }
      }

      const completedOvers = Math.floor(newTotalBalls / 6);
      const remainingBalls = newTotalBalls % 6;
      const totalOvers = completedOvers + remainingBalls / 10;
      const runRate = newTotalBalls > 0 ? (newTotalRuns / (newTotalBalls / 6)) : 0;

      // #17: Auto-complete innings when 10 wickets or all overs bowled
      const isAllOut = newWickets >= 10;
      const isAllOversBowled = newTotalBalls >= matchOvers * 6;
      const shouldComplete = isAllOut || isAllOversBowled;

      await tx.innings.update({
        where: { id: inningsId },
        data: {
          totalRuns: newTotalRuns,
          totalBalls: newTotalBalls,
          totalWickets: newWickets,
          totalOvers: new Prisma.Decimal(totalOvers.toFixed(1)),
          extras: newExtras,
          ...extraIncrements,
          runRate: new Prisma.Decimal(runRate.toFixed(2)),
          status: shouldComplete ? "COMPLETED" : "IN_PROGRESS",
        },
      });

      if (!request.skipAutoCommentary) {
        const [bat, bowl] = await Promise.all([
          tx.player.findUnique({ where: { id: request.batsmanId }, select: { displayName: true } }),
          tx.player.findUnique({ where: { id: request.bowlerId }, select: { displayName: true } }),
        ]);
        const bn = bat?.displayName ?? "Batsman";
        const bw = bowl?.displayName ?? "Bowler";
        let text: string;
        if (request.isWicket) {
          text = `${request.overNo}.${request.ballNo} WICKET — ${bn} ${request.dismissalType?.replace(/_/g, " ").toLowerCase() ?? "out"}`;
        } else if (request.isExtra) {
          text = `${request.overNo}.${request.ballNo} ${request.extraType ?? "Extra"} — ${ballTotalRuns} run(s). ${bn} facing ${bw}`;
        } else if (ballTotalRuns === 0) {
          text = `${request.overNo}.${request.ballNo} Dot — ${bw} to ${bn}`;
        } else if (request.isSix) {
          text = `${request.overNo}.${request.ballNo} SIX! ${bn} off ${bw}`;
        } else if (request.isFour) {
          text = `${request.overNo}.${request.ballNo} FOUR! ${bn} off ${bw}`;
        } else {
          text = `${request.overNo}.${request.ballNo} ${ballTotalRuns} run(s) — ${bn} off ${bw}`;
        }
        if (request.commentaryNote) text = `${text} · ${request.commentaryNote}`;

        if (shouldComplete) {
          const reason = isAllOut ? "ALL OUT" : "Innings complete";
          text = `${text} · ${reason} — ${newTotalRuns}/${newWickets} (${totalOvers.toFixed(1)} ov)`;
        }

        await tx.commentary.create({
          data: {
            inningsId,
            overNo: request.overNo,
            ballNo: request.ballNo,
            text,
            isHighlight: Boolean(request.isFour || request.isSix || request.isWicket || shouldComplete),
          },
        });
      }

      return ball;
    });

    return { status: 201, body: successResponse(mapBallItem(result), "Ball recorded") };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "This ball already exists in this over") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to record ball")) };
  }
}

export async function listBalls(inningsId: string) {
  try {
    const balls = await prisma.ballByBall.findMany({
      where: { inningsId },
      orderBy: [{ overNo: "asc" }, { ballNo: "asc" }],
    });
    return { status: 200, body: successResponse(balls.map(mapBallItem)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load balls")) };
  }
}

export async function listCommentary(inningsId: string) {
  try {
    const entries = await prisma.commentary.findMany({
      where: { inningsId },
      orderBy: [{ overNo: "desc" }, { createdAt: "desc" }],
    });
    return { status: 200, body: successResponse(entries.map(mapCommentaryItem)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load commentary")) };
  }
}

export async function addCommentary(inningsId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: AddCommentaryRequest = {
      overNo: safeNumber(body.overNo) ?? -1,
      ballNo: safeNumber(body.ballNo),
      text: safeString(body.text) ?? "",
      isHighlight: Boolean(body.isHighlight),
    };

    if (request.overNo < 0 || !request.text) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "overNo (>=0) and text are required") };
    }

    const innings = await prisma.innings.findUnique({ where: { id: inningsId } });
    if (!innings) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Innings not found") };
    }

    const created = await prisma.commentary.create({
      data: {
        inningsId,
        overNo: request.overNo,
        ballNo: request.ballNo,
        text: request.text,
        isHighlight: request.isHighlight ?? false,
      },
    });
    return { status: 201, body: successResponse(mapCommentaryItem(created), "Commentary added") };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to add commentary")) };
  }
}
