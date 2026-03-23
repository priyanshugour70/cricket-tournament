import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";
import type {
  CreateTeamRequest,
  CreateTournamentRequest,
  RegisterPlayerRequest,
  TeamListItem,
  TournamentDetails,
  TournamentListItem,
  TournamentPlayerItem,
} from "@/types/api/tournaments";

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
function decimalToString(v: Prisma.Decimal | null | undefined): string {
  if (!v) return "0";
  return v.toString();
}

function mapTournamentListItem(item: {
  id: string; code: string; name: string; shortName: string | null; season: number;
  status: TournamentDetails["status"]; format: TournamentDetails["format"];
  startsOn: Date | null; endsOn: Date | null; pursePerTeam: Prisma.Decimal; createdAt: Date;
  _count: { teams: number; playerRegistrations: number; matches: number };
}): TournamentListItem {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    shortName: item.shortName,
    season: item.season,
    status: item.status,
    format: item.format,
    teamCount: item._count.teams,
    playerRegistrationCount: item._count.playerRegistrations,
    matchCount: item._count.matches,
    startsOn: item.startsOn?.toISOString() ?? null,
    endsOn: item.endsOn?.toISOString() ?? null,
    pursePerTeam: decimalToString(item.pursePerTeam),
    createdAt: item.createdAt.toISOString(),
  };
}

function mapTournamentDetails(item: {
  id: string; code: string; name: string; shortName: string | null; season: number;
  status: TournamentDetails["status"]; format: TournamentDetails["format"];
  startsOn: Date | null; endsOn: Date | null; pursePerTeam: Prisma.Decimal; createdAt: Date;
  organizerName: string | null; organizerEmail: string | null; venueCity: string | null;
  country: string | null; timezone: string; maxTeams: number; minSquadSize: number;
  maxSquadSize: number; overseasLimit: number; notes: string | null;
  _count: { teams: number; playerRegistrations: number; matches: number };
}): TournamentDetails {
  return {
    ...mapTournamentListItem(item),
    organizerName: item.organizerName,
    organizerEmail: item.organizerEmail,
    venueCity: item.venueCity,
    country: item.country,
    timezone: item.timezone,
    maxTeams: item.maxTeams,
    minSquadSize: item.minSquadSize,
    maxSquadSize: item.maxSquadSize,
    overseasLimit: item.overseasLimit,
    notes: item.notes,
  };
}

export async function listTournaments() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: [{ season: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { teams: true, playerRegistrations: true, matches: true } } },
    });
    return { status: 200, body: successResponse(tournaments.map(mapTournamentListItem)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load tournaments")) };
  }
}

export async function createTournament(payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: CreateTournamentRequest = {
      code: safeString(body.code) ?? "",
      name: safeString(body.name) ?? "",
      season: safeNumber(body.season) ?? new Date().getFullYear(),
      pursePerTeam: safeNumber(body.pursePerTeam) ?? 0,
      shortName: safeString(body.shortName),
      format: body.format as CreateTournamentRequest["format"],
      status: body.status as CreateTournamentRequest["status"],
      organizerName: safeString(body.organizerName),
      organizerEmail: safeString(body.organizerEmail),
      venueCity: safeString(body.venueCity),
      country: safeString(body.country),
      timezone: safeString(body.timezone),
      startsOn: safeString(body.startsOn),
      endsOn: safeString(body.endsOn),
      maxTeams: safeNumber(body.maxTeams),
      minSquadSize: safeNumber(body.minSquadSize),
      maxSquadSize: safeNumber(body.maxSquadSize),
      overseasLimit: safeNumber(body.overseasLimit),
      notes: safeString(body.notes),
    };
    if (!request.code || !request.name || request.pursePerTeam <= 0) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "code, name and pursePerTeam (> 0) are required") };
    }

    const created = await prisma.tournament.create({
      data: {
        code: request.code,
        name: request.name,
        shortName: request.shortName,
        season: request.season,
        format: request.format,
        status: request.status,
        organizerName: request.organizerName,
        organizerEmail: request.organizerEmail,
        venueCity: request.venueCity,
        country: request.country,
        timezone: request.timezone ?? "Asia/Kolkata",
        startsOn: safeDate(request.startsOn),
        endsOn: safeDate(request.endsOn),
        maxTeams: request.maxTeams,
        minSquadSize: request.minSquadSize,
        maxSquadSize: request.maxSquadSize,
        overseasLimit: request.overseasLimit,
        pursePerTeam: request.pursePerTeam,
        notes: request.notes,
      },
      include: { _count: { select: { teams: true, playerRegistrations: true, matches: true } } },
    });
    return { status: 201, body: successResponse(mapTournamentDetails(created), "Tournament created successfully") };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "Tournament with this code or name/season already exists") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to create tournament")) };
  }
}

export async function getTournamentById(tournamentId: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { _count: { select: { teams: true, playerRegistrations: true, matches: true } } },
    });
    if (!tournament) return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Tournament not found") };
    return { status: 200, body: successResponse(mapTournamentDetails(tournament)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to fetch tournament")) };
  }
}

function mapTeamItem(team: {
  id: string; tournamentId: string; code: string; name: string; shortName: string | null;
  status: TeamListItem["status"]; city: string | null; purseTotal: Prisma.Decimal;
  purseSpent: Prisma.Decimal; purseRemaining: Prisma.Decimal; _count: { squadPlayers: number };
}): TeamListItem {
  return {
    id: team.id,
    tournamentId: team.tournamentId,
    code: team.code,
    name: team.name,
    shortName: team.shortName,
    status: team.status,
    city: team.city,
    purseTotal: decimalToString(team.purseTotal),
    purseSpent: decimalToString(team.purseSpent),
    purseRemaining: decimalToString(team.purseRemaining),
    squadCount: team._count.squadPlayers,
  };
}

export async function listTournamentTeams(tournamentId: string) {
  try {
    const teams = await prisma.team.findMany({
      where: { tournamentId },
      orderBy: [{ name: "asc" }],
      include: { _count: { select: { squadPlayers: true } } },
    });
    return { status: 200, body: successResponse(teams.map(mapTeamItem)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to fetch teams")) };
  }
}

export async function createTournamentTeam(tournamentId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: CreateTeamRequest = {
      code: safeString(body.code) ?? "",
      name: safeString(body.name) ?? "",
      shortName: safeString(body.shortName),
      ownerName: safeString(body.ownerName),
      managerName: safeString(body.managerName),
      coachName: safeString(body.coachName),
      city: safeString(body.city),
      homeGround: safeString(body.homeGround),
      logoUrl: safeString(body.logoUrl),
      status: body.status as CreateTeamRequest["status"],
      purseTotal: safeNumber(body.purseTotal) ?? 0,
      squadMin: safeNumber(body.squadMin),
      squadMax: safeNumber(body.squadMax),
      overseasMin: safeNumber(body.overseasMin),
      overseasMax: safeNumber(body.overseasMax),
      contactEmail: safeString(body.contactEmail),
      contactPhone: safeString(body.contactPhone),
    };
    if (!request.code || !request.name || request.purseTotal <= 0) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "code, name and purseTotal (> 0) are required") };
    }

    const created = await prisma.team.create({
      data: {
        tournamentId,
        code: request.code,
        name: request.name,
        shortName: request.shortName,
        ownerName: request.ownerName,
        managerName: request.managerName,
        coachName: request.coachName,
        city: request.city,
        homeGround: request.homeGround,
        logoUrl: request.logoUrl,
        status: request.status,
        purseTotal: request.purseTotal,
        purseRemaining: request.purseTotal,
        squadMin: request.squadMin,
        squadMax: request.squadMax,
        overseasMin: request.overseasMin,
        overseasMax: request.overseasMax,
        contactEmail: request.contactEmail,
        contactPhone: request.contactPhone,
      },
      include: { _count: { select: { squadPlayers: true } } },
    });
    return { status: 201, body: successResponse(mapTeamItem(created), "Team created successfully") };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "Team with this code or name already exists for this tournament") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to create team")) };
  }
}

function mapTournamentPlayer(item: {
  id: string; registrationNumber: string; status: TournamentPlayerItem["status"];
  expectedPrice: Prisma.Decimal | null; createdAt: Date;
  player: {
    id: string; displayName: string; role: TournamentPlayerItem["role"];
    battingStyle: TournamentPlayerItem["battingStyle"];
    bowlingStyle: TournamentPlayerItem["bowlingStyle"];
    isOverseas: boolean;
  };
}): TournamentPlayerItem {
  return {
    registrationId: item.id,
    registrationNumber: item.registrationNumber,
    status: item.status,
    playerId: item.player.id,
    displayName: item.player.displayName,
    role: item.player.role,
    battingStyle: item.player.battingStyle,
    bowlingStyle: item.player.bowlingStyle,
    isOverseas: item.player.isOverseas,
    expectedPrice: item.expectedPrice?.toString() ?? null,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function listTournamentPlayers(tournamentId: string) {
  try {
    const registrations = await prisma.tournamentPlayerRegistration.findMany({
      where: { tournamentId },
      orderBy: [{ createdAt: "desc" }],
      include: { player: { select: { id: true, displayName: true, role: true, battingStyle: true, bowlingStyle: true, isOverseas: true } } },
    });
    return { status: 200, body: successResponse(registrations.map(mapTournamentPlayer)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to fetch tournament players")) };
  }
}

export async function updateTournamentStatus(tournamentId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const status = safeString(body.status);

    if (!status) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "status is required") };
    }

    const existing = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!existing) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Tournament not found") };
    }

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: status as TournamentDetails["status"] },
      include: { _count: { select: { teams: true, playerRegistrations: true, matches: true } } },
    });
    return { status: 200, body: successResponse(mapTournamentDetails(updated), "Tournament status updated") };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to update tournament status")) };
  }
}

export async function registerTournamentPlayer(tournamentId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: RegisterPlayerRequest = {
      playerId: safeString(body.playerId),
      firstName: safeString(body.firstName),
      lastName: safeString(body.lastName),
      displayName: safeString(body.displayName) ?? "",
      role: body.role as RegisterPlayerRequest["role"],
      battingStyle: body.battingStyle as RegisterPlayerRequest["battingStyle"],
      bowlingStyle: body.bowlingStyle as RegisterPlayerRequest["bowlingStyle"],
      isOverseas: Boolean(body.isOverseas),
      isWicketKeeper: Boolean(body.isWicketKeeper),
      nationality: safeString(body.nationality),
      state: safeString(body.state),
      city: safeString(body.city),
      reservePrice: safeNumber(body.reservePrice),
      basePrice: safeNumber(body.basePrice),
      expectedPrice: safeNumber(body.expectedPrice),
      registrationNumber: safeString(body.registrationNumber),
    };
    if (!request.displayName || !request.role) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "displayName and role are required") };
    }

    const result = await prisma.$transaction(async (tx) => {
      const player = request.playerId ? await tx.player.findUnique({ where: { id: request.playerId } }) : null;
      const upsertedPlayer =
        player ??
        (await tx.player.create({
          data: {
            firstName: request.firstName ?? request.displayName,
            lastName: request.lastName,
            displayName: request.displayName,
            role: request.role,
            battingStyle: request.battingStyle,
            bowlingStyle: request.bowlingStyle,
            isOverseas: request.isOverseas,
            isWicketKeeper: request.isWicketKeeper,
            nationality: request.nationality,
            state: request.state,
            city: request.city,
            reservePrice: request.reservePrice,
            basePrice: request.basePrice,
          },
        }));

      return tx.tournamentPlayerRegistration.create({
        data: {
          tournamentId,
          playerId: upsertedPlayer.id,
          registrationNumber:
            request.registrationNumber ??
            `REG-${Date.now()}-${upsertedPlayer.id.slice(0, 6).toUpperCase()}`,
          expectedPrice: request.expectedPrice,
        },
        include: { player: { select: { id: true, displayName: true, role: true, battingStyle: true, bowlingStyle: true, isOverseas: true } } },
      });
    });

    return { status: 201, body: successResponse(mapTournamentPlayer(result), "Player registered to tournament") };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "Player is already registered in this tournament") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to register player")) };
  }
}

