import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";
import type {
  AuctionRoundItem,
  AuctionSeriesItem,
  BidItem,
  CreateAuctionRoundRequest,
  CreateAuctionSeriesRequest,
  PlaceBidRequest,
  SellPlayerRequest,
} from "@/types/api/auction";

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

function mapSeriesItem(item: {
  id: string;
  tournamentId: string;
  name: string;
  sequenceNo: number;
  status: string;
  minBidIncrement: Prisma.Decimal;
  totalPlayersSold: number;
  totalAmountSpent: Prisma.Decimal;
  startsAt: Date | null;
  endsAt: Date | null;
  _count: { rounds: number };
}): AuctionSeriesItem {
  return {
    id: item.id,
    tournamentId: item.tournamentId,
    name: item.name,
    sequenceNo: item.sequenceNo,
    status: item.status,
    minBidIncrement: item.minBidIncrement.toString(),
    totalPlayersSold: item.totalPlayersSold,
    totalAmountSpent: item.totalAmountSpent.toString(),
    startsAt: item.startsAt?.toISOString() ?? null,
    endsAt: item.endsAt?.toISOString() ?? null,
    roundCount: item._count.rounds,
  };
}

function mapRoundItem(item: {
  id: string;
  auctionSeriesId: string;
  roundNo: number;
  name: string;
  type: string;
  maxPlayers: number | null;
  playersSold: number;
  amountSpent: Prisma.Decimal;
}): AuctionRoundItem {
  return {
    id: item.id,
    auctionSeriesId: item.auctionSeriesId,
    roundNo: item.roundNo,
    name: item.name,
    type: item.type,
    maxPlayers: item.maxPlayers,
    playersSold: item.playersSold,
    amountSpent: item.amountSpent.toString(),
  };
}

function mapBidItem(item: {
  id: string;
  teamId: string;
  playerId: string;
  bidAmount: Prisma.Decimal;
  isWinningBid: boolean;
  bidAt: Date;
  team: { name: string };
  player: { displayName: string };
}): BidItem {
  return {
    id: item.id,
    teamId: item.teamId,
    teamName: item.team.name,
    playerId: item.playerId,
    playerName: item.player.displayName,
    bidAmount: item.bidAmount.toString(),
    isWinningBid: item.isWinningBid,
    bidAt: item.bidAt.toISOString(),
  };
}

const bidInclude = {
  team: { select: { name: true } },
  player: { select: { displayName: true } },
} as const;

export async function listAuctionSeries(tournamentId: string) {
  try {
    const series = await prisma.auctionSeries.findMany({
      where: { tournamentId },
      orderBy: [{ sequenceNo: "asc" }],
      include: { _count: { select: { rounds: true } } },
    });
    return { status: 200, body: successResponse(series.map(mapSeriesItem)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load auction series")) };
  }
}

export async function createAuctionSeries(tournamentId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: CreateAuctionSeriesRequest = {
      name: safeString(body.name) ?? "",
      sequenceNo: safeNumber(body.sequenceNo) ?? 0,
      minBidIncrement: safeNumber(body.minBidIncrement),
      defaultBidTimeSec: safeNumber(body.defaultBidTimeSec),
      maxBidTimeSec: safeNumber(body.maxBidTimeSec),
    };

    if (!request.name || !request.sequenceNo) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "name and sequenceNo are required") };
    }

    const created = await prisma.auctionSeries.create({
      data: {
        tournamentId,
        name: request.name,
        sequenceNo: request.sequenceNo,
        minBidIncrement: request.minBidIncrement,
        defaultBidTimeSec: request.defaultBidTimeSec,
        maxBidTimeSec: request.maxBidTimeSec,
      },
      include: { _count: { select: { rounds: true } } },
    });
    return { status: 201, body: successResponse(mapSeriesItem(created), "Auction series created") };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "An auction series with this sequence already exists") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to create auction series")) };
  }
}

export async function listAuctionRounds(auctionSeriesId: string) {
  try {
    const rounds = await prisma.auctionRound.findMany({
      where: { auctionSeriesId },
      orderBy: [{ roundNo: "asc" }],
    });
    return { status: 200, body: successResponse(rounds.map(mapRoundItem)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load auction rounds")) };
  }
}

export async function createAuctionRound(auctionSeriesId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: CreateAuctionRoundRequest = {
      roundNo: safeNumber(body.roundNo) ?? 0,
      name: safeString(body.name) ?? "",
      type: safeString(body.type) ?? "",
      maxPlayers: safeNumber(body.maxPlayers),
    };

    if (!request.roundNo || !request.name || !request.type) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "roundNo, name and type are required") };
    }

    const series = await prisma.auctionSeries.findUnique({ where: { id: auctionSeriesId } });
    if (!series) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Auction series not found") };
    }

    const created = await prisma.auctionRound.create({
      data: {
        auctionSeriesId,
        roundNo: request.roundNo,
        name: request.name,
        type: request.type as "MARQUEE" | "CAPPED" | "UNCAPPED" | "EMERGING" | "OVERSEAS" | "ACCELERATED",
        maxPlayers: request.maxPlayers,
      },
    });
    return { status: 201, body: successResponse(mapRoundItem(created), "Auction round created") };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "A round with this number already exists in this series") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to create auction round")) };
  }
}

export async function listBids(tournamentId: string, auctionSeriesId?: string) {
  try {
    const where: Prisma.AuctionBidWhereInput = { tournamentId };
    if (auctionSeriesId) where.auctionSeriesId = auctionSeriesId;

    const bids = await prisma.auctionBid.findMany({
      where,
      orderBy: [{ bidAt: "desc" }],
      include: bidInclude,
    });
    return { status: 200, body: successResponse(bids.map(mapBidItem)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load bids")) };
  }
}

export async function placeBid(tournamentId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: PlaceBidRequest = {
      teamId: safeString(body.teamId) ?? "",
      playerId: safeString(body.playerId) ?? "",
      bidAmount: safeNumber(body.bidAmount) ?? 0,
      auctionRoundId: safeString(body.auctionRoundId),
    };

    if (!request.teamId || !request.playerId || request.bidAmount <= 0) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "teamId, playerId and bidAmount (> 0) are required") };
    }

    const activeSeries = await prisma.auctionSeries.findFirst({
      where: { tournamentId, status: "LIVE" },
    });
    if (!activeSeries) {
      return { status: 400, body: errorResponse(ErrorCodes.BAD_REQUEST, "No active auction series found for this tournament") };
    }

    const created = await prisma.auctionBid.create({
      data: {
        tournamentId,
        auctionSeriesId: activeSeries.id,
        auctionRoundId: request.auctionRoundId,
        teamId: request.teamId,
        playerId: request.playerId,
        bidAmount: request.bidAmount,
      },
      include: bidInclude,
    });
    return { status: 201, body: successResponse(mapBidItem(created), "Bid placed") };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to place bid")) };
  }
}

export async function sellPlayer(tournamentId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: SellPlayerRequest = {
      playerId: safeString(body.playerId) ?? "",
      teamId: safeString(body.teamId) ?? "",
      soldPrice: safeNumber(body.soldPrice) ?? 0,
      auctionSeriesId: safeString(body.auctionSeriesId) ?? "",
      auctionRoundId: safeString(body.auctionRoundId),
    };

    if (!request.playerId || !request.teamId || request.soldPrice <= 0 || !request.auctionSeriesId) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "playerId, teamId, soldPrice (> 0) and auctionSeriesId are required") };
    }

    const result = await prisma.$transaction(async (tx) => {
      const bid = await tx.auctionBid.create({
        data: {
          tournamentId,
          auctionSeriesId: request.auctionSeriesId,
          auctionRoundId: request.auctionRoundId,
          teamId: request.teamId,
          playerId: request.playerId,
          bidAmount: request.soldPrice,
          isWinningBid: true,
        },
        include: bidInclude,
      });

      const player = await tx.player.findUniqueOrThrow({ where: { id: request.playerId } });

      await tx.teamSquadPlayer.create({
        data: {
          tournamentId,
          teamId: request.teamId,
          playerId: request.playerId,
          acquisitionType: "AUCTION",
          acquisitionAmount: request.soldPrice,
          isOverseas: player.isOverseas,
        },
      });

      const team = await tx.team.findUniqueOrThrow({ where: { id: request.teamId } });
      const newSpent = team.purseSpent.add(new Prisma.Decimal(request.soldPrice));
      const newRemaining = team.purseTotal.sub(newSpent);

      await tx.team.update({
        where: { id: request.teamId },
        data: { purseSpent: newSpent, purseRemaining: newRemaining },
      });

      await tx.teamPurseLedger.create({
        data: {
          teamId: request.teamId,
          tournamentId,
          amount: request.soldPrice,
          direction: "DEBIT",
          transactionType: "AUCTION_PURCHASE",
          referenceType: "AUCTION_BID",
          referenceId: bid.id,
          balanceAfter: newRemaining,
          remarks: `Purchased ${player.displayName} for ${request.soldPrice}`,
        },
      });

      await tx.auctionSeries.update({
        where: { id: request.auctionSeriesId },
        data: {
          totalPlayersSold: { increment: 1 },
          totalAmountSpent: { increment: request.soldPrice },
        },
      });

      if (request.auctionRoundId) {
        await tx.auctionRound.update({
          where: { id: request.auctionRoundId },
          data: {
            playersSold: { increment: 1 },
            amountSpent: { increment: request.soldPrice },
          },
        });
      }

      return bid;
    });

    return { status: 200, body: successResponse(mapBidItem(result), "Player sold successfully") };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "Player is already in a squad for this tournament") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to sell player")) };
  }
}
