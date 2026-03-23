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
