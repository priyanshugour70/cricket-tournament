import { prisma } from "@/lib/prisma";
import { ErrorCodes, errorResponse, getErrorMessage, successResponse } from "@/types";
import type { TournamentSettingsItem } from "@/types/api/tournaments";

function asRecord(p: unknown): Record<string, unknown> {
  return p && typeof p === "object" ? (p as Record<string, unknown>) : {};
}

function mapSettings(s: {
  id: string; tournamentId: string;
  autoSchedule: boolean; allowLateReg: boolean; requireApproval: boolean;
  enableLiveScoring: boolean; enableCommentary: boolean; enableNotifications: boolean;
  emailOnRegistration: boolean; emailOnApproval: boolean; emailOnMatchResult: boolean;
  publicScoreboard: boolean; showPlayerStats: boolean; showTeamFinances: boolean;
  auctionBidTimeSec: number; auctionMinIncrement: { toString(): string };
  matchDlsEnabled: boolean; powerplayEnd: number; middleOversEnd: number;
  maxOversPerBowler: number; freeHitOnNoBall: boolean;
  wideRunPenalty: number; noBallRunPenalty: number; customRules: string | null;
}): TournamentSettingsItem {
  return {
    id: s.id,
    tournamentId: s.tournamentId,
    autoSchedule: s.autoSchedule,
    allowLateReg: s.allowLateReg,
    requireApproval: s.requireApproval,
    enableLiveScoring: s.enableLiveScoring,
    enableCommentary: s.enableCommentary,
    enableNotifications: s.enableNotifications,
    emailOnRegistration: s.emailOnRegistration,
    emailOnApproval: s.emailOnApproval,
    emailOnMatchResult: s.emailOnMatchResult,
    publicScoreboard: s.publicScoreboard,
    showPlayerStats: s.showPlayerStats,
    showTeamFinances: s.showTeamFinances,
    auctionBidTimeSec: s.auctionBidTimeSec,
    auctionMinIncrement: s.auctionMinIncrement.toString(),
    matchDlsEnabled: s.matchDlsEnabled,
    powerplayEnd: s.powerplayEnd,
    middleOversEnd: s.middleOversEnd,
    maxOversPerBowler: s.maxOversPerBowler,
    freeHitOnNoBall: s.freeHitOnNoBall,
    wideRunPenalty: s.wideRunPenalty,
    noBallRunPenalty: s.noBallRunPenalty,
    customRules: s.customRules,
  };
}

export async function getSettings(tournamentId: string) {
  try {
    const existing = await prisma.tournamentSettings.findUnique({ where: { tournamentId } });
    if (!existing) {
      const created = await prisma.tournamentSettings.create({ data: { tournamentId } });
      return { status: 200, body: successResponse(mapSettings(created)) };
    }
    return { status: 200, body: successResponse(mapSettings(existing)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load settings")) };
  }
}

export async function updateSettings(tournamentId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const data: Record<string, unknown> = {};
    const boolKeys = [
      "autoSchedule", "allowLateReg", "requireApproval", "enableLiveScoring",
      "enableCommentary", "enableNotifications", "emailOnRegistration",
      "emailOnApproval", "emailOnMatchResult", "publicScoreboard",
      "showPlayerStats", "showTeamFinances", "matchDlsEnabled",
      "freeHitOnNoBall",
    ] as const;
    const intKeys = [
      "auctionBidTimeSec", "powerplayEnd", "middleOversEnd",
      "maxOversPerBowler", "wideRunPenalty", "noBallRunPenalty",
    ] as const;

    for (const k of boolKeys) {
      if (typeof body[k] === "boolean") data[k] = body[k];
    }
    for (const k of intKeys) {
      if (typeof body[k] === "number") data[k] = body[k];
    }
    if (typeof body.auctionMinIncrement === "number") data.auctionMinIncrement = body.auctionMinIncrement;
    if (typeof body.customRules === "string") data.customRules = body.customRules || null;

    if (typeof data.powerplayEnd === "number" && (data.powerplayEnd as number) < 0) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "powerplayEnd cannot be negative") };
    }
    if (typeof data.middleOversEnd === "number" && (data.middleOversEnd as number) < 0) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "middleOversEnd cannot be negative") };
    }
    if (typeof data.maxOversPerBowler === "number" && (data.maxOversPerBowler as number) < 1) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "maxOversPerBowler must be at least 1") };
    }
    if (typeof data.wideRunPenalty === "number" && (data.wideRunPenalty as number) < 0) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "wideRunPenalty cannot be negative") };
    }
    if (typeof data.noBallRunPenalty === "number" && (data.noBallRunPenalty as number) < 0) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "noBallRunPenalty cannot be negative") };
    }
    if (typeof data.auctionBidTimeSec === "number" && (data.auctionBidTimeSec as number) < 1) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "auctionBidTimeSec must be at least 1") };
    }

    const updated = await prisma.tournamentSettings.upsert({
      where: { tournamentId },
      create: { tournamentId, ...data },
      update: data,
    });
    return { status: 200, body: successResponse(mapSettings(updated), "Settings updated") };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to update settings")) };
  }
}
