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
  AuctionSaleItem,
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
  activePlayerId: string | null;
  activeAt: Date | null;
  playersSold: number;
  amountSpent: Prisma.Decimal;
  startsAt: Date | null;
  endsAt: Date | null;
  nominationOrder: unknown;
}): AuctionRoundItem {
  const nominationOrder = item.nominationOrder;
  const nominees: { playerId: string; basePrice: string }[] = Array.isArray(nominationOrder)
    ? nominationOrder
        .map((n: unknown) => {
          if (!n || typeof n !== "object") return null;
          const r = n as Record<string, unknown>;
          const playerId = typeof r.playerId === "string" ? r.playerId : null;
          const basePrice =
            typeof r.basePrice === "string" && r.basePrice.trim().length > 0
              ? r.basePrice
              : null;
          if (!playerId || !basePrice) return null;
          return { playerId, basePrice };
        })
        .filter((x: unknown): x is { playerId: string; basePrice: string } => x !== null)
    : [];

  return {
    id: item.id,
    auctionSeriesId: item.auctionSeriesId,
    roundNo: item.roundNo,
    name: item.name,
    type: item.type,
    maxPlayers: item.maxPlayers,
    activePlayerId: item.activePlayerId,
    activeAt: item.activeAt?.toISOString() ?? null,
    playersSold: item.playersSold,
    amountSpent: item.amountSpent.toString(),
    startsAt: item.startsAt?.toISOString() ?? null,
    endsAt: item.endsAt?.toISOString() ?? null,
    nominees,
  };
}

const bidInclude = {
  team: { select: { name: true } },
  player: { select: { displayName: true, isOverseas: true } },
  placedByUser: { select: { displayName: true } },
} as const;

type BidWithRelations = Prisma.AuctionBidGetPayload<{ include: typeof bidInclude }>;

function mapBidItem(item: BidWithRelations): BidItem {
  return {
    id: item.id,
    teamId: item.teamId,
    teamName: item.team.name,
    playerId: item.playerId,
    playerName: item.player.displayName,
    bidAmount: item.bidAmount.toString(),
    isWinningBid: item.isWinningBid,
    bidAt: item.bidAt.toISOString(),
    auctionRoundId: item.auctionRoundId,
    placedByUserId: item.placedByUserId,
    placedByDisplayName: item.placedByUser?.displayName ?? null,
    ipAddress: item.ipAddress,
    userAgent: item.userAgent,
  };
}

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

export async function startAuctionRound(tournamentId: string, auctionSeriesId: string, roundId: string) {
  try {
    const series = await prisma.auctionSeries.findFirst({
      where: { id: auctionSeriesId, tournamentId },
    });
    if (!series) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "No active auction series found to start bidding") };
    }

    const round = await prisma.auctionRound.findFirst({
      where: { id: roundId, auctionSeriesId },
      select: { id: true },
    });
    if (!round) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Auction round not found") };
    }

    const updated = await prisma.auctionRound.update({
      where: { id: roundId },
      data: {
        startsAt: new Date(),
        endsAt: null,
      },
    });

    return { status: 200, body: successResponse(mapRoundItem(updated), "Round bidding started") };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to start auction round")) };
  }
}

export async function closeAuctionRound(tournamentId: string, auctionSeriesId: string, roundId: string) {
  try {
    const series = await prisma.auctionSeries.findFirst({
      where: { id: auctionSeriesId, tournamentId },
    });
    if (!series) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "No active auction series found to close bidding") };
    }

    const round = await prisma.auctionRound.findFirst({
      where: { id: roundId, auctionSeriesId },
      select: { id: true },
    });
    if (!round) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Auction round not found") };
    }

    const updated = await prisma.auctionRound.update({
      where: { id: roundId },
      data: {
        endsAt: new Date(),
        activePlayerId: null,
        activeAt: null,
      },
    });

    return { status: 200, body: successResponse(mapRoundItem(updated), "Round bidding closed") };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to close auction round")) };
  }
}

export async function startRoundPlayerAuction(
  tournamentId: string,
  auctionSeriesId: string,
  roundId: string,
  payload: unknown,
) {
  try {
    const body = asRecord(payload);
    const playerId = safeString(body.playerId) ?? "";
    if (!playerId) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "playerId is required") };
    }

    const round = await prisma.auctionRound.findFirst({
      where: { id: roundId, auctionSeriesId, auctionSeries: { tournamentId } },
      select: { id: true, startsAt: true, endsAt: true, nominationOrder: true, activePlayerId: true },
    });
    if (!round) return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Auction round not found") };
    if (!round.startsAt || round.endsAt) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Round is not live") };
    }

    const nominees = Array.isArray(round.nominationOrder)
      ? round.nominationOrder
      : [];
    const exists = nominees.some((n) => typeof n === "object" && n && (n as Record<string, unknown>).playerId === playerId);
    if (!exists) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Player is not nominated in this round") };
    }

    const alreadySold = await prisma.teamSquadPlayer.findFirst({
      where: { tournamentId, playerId, isActive: true },
      select: { id: true },
    });
    if (alreadySold) {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "Player is already sold") };
    }

    const updated = await prisma.auctionRound.update({
      where: { id: roundId },
      data: { activePlayerId: playerId, activeAt: new Date() },
    });
    return { status: 200, body: successResponse(mapRoundItem(updated), "Player auction started") };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to start player auction")) };
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
      playerIds: Array.isArray(body.playerIds)
        ? (body.playerIds as unknown[]).filter((p) => typeof p === "string") as string[]
        : undefined,
    };

    if (!request.roundNo || !request.name || !request.type) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "roundNo, name and type are required") };
    }

    const series = await prisma.auctionSeries.findUnique({ where: { id: auctionSeriesId } });
    if (!series) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Auction series not found") };
    }

    let nominationOrder: { playerId: string; basePrice: string }[] | undefined = undefined;
    if (request.playerIds && request.playerIds.length > 0) {
      const players = await prisma.player.findMany({
        where: { id: { in: request.playerIds } },
        select: { id: true, basePrice: true, reservePrice: true },
      });

      const playerById = new Map(players.map((p) => [p.id, p]));
      const nominees: { playerId: string; basePrice: string }[] = [];
      for (const pid of request.playerIds) {
        const p = playerById.get(pid);
        if (!p) {
          return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, `Player ${pid} not found`) };
        }
        const base = p.basePrice ?? p.reservePrice;
        if (!base) {
          return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, `Player ${pid} has no base price`) };
        }
        nominees.push({ playerId: pid, basePrice: base.toString() });
      }

      nominationOrder = nominees;
    }

    const created = await prisma.auctionRound.create({
      data: {
        auctionSeriesId,
        roundNo: request.roundNo,
        name: request.name,
        type: request.type as "MARQUEE" | "CAPPED" | "UNCAPPED" | "EMERGING" | "OVERSEAS" | "ACCELERATED",
        maxPlayers: request.maxPlayers ?? (nominationOrder ? nominationOrder.length : undefined),
        nominationOrder,
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

export async function placeBid(
  tournamentId: string,
  payload: unknown,
  bidContext?: { placedByUserId?: string | null; ipAddress?: string | null; userAgent?: string | null },
) {
  try {
    const body = asRecord(payload);
    const request: PlaceBidRequest = {
      teamId: safeString(body.teamId) ?? "",
      playerId: safeString(body.playerId) ?? "",
      bidAmount: safeNumber(body.bidAmount) ?? 0,
      auctionRoundId: safeString(body.auctionRoundId),
    };

    if (!request.teamId || !request.playerId || !request.auctionRoundId || request.bidAmount <= 0) {
      return {
        status: 400,
        body: errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "teamId, playerId, auctionRoundId and bidAmount (> 0) are required",
        ),
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const round = await tx.auctionRound.findFirst({
        where: { id: request.auctionRoundId },
        select: {
          id: true,
          auctionSeriesId: true,
          startsAt: true,
          endsAt: true,
          activePlayerId: true,
          nominationOrder: true,
          auctionSeries: { select: { minBidIncrement: true } },
        },
      });
      if (!round) throw new Error("ROUND_NOT_IN_SERIES");
      if (round.auctionSeriesId) {
        const seriesTournament = await tx.auctionSeries.findFirst({
          where: { id: round.auctionSeriesId },
          select: { tournamentId: true },
        });
        if (!seriesTournament || seriesTournament.tournamentId !== tournamentId) {
          throw new Error("ROUND_NOT_IN_SERIES");
        }
      }

      if (!round.startsAt || round.endsAt) throw new Error("ROUND_NOT_LIVE");
      if (round.activePlayerId && request.playerId !== round.activePlayerId) throw new Error("PLAYER_NOT_ACTIVE");

      const nominationOrder = round.nominationOrder;
      const nominees: { playerId: string; basePrice: string }[] = Array.isArray(nominationOrder)
        ? nominationOrder
            .map((n: unknown) => {
              if (!n || typeof n !== "object") return null;
              const r = n as Record<string, unknown>;
              const playerId = typeof r.playerId === "string" ? r.playerId : null;
              const basePrice = typeof r.basePrice === "string" ? r.basePrice : null;
              if (!playerId || !basePrice) return null;
              return { playerId, basePrice };
            })
            .filter((x: unknown): x is { playerId: string; basePrice: string } => x !== null)
        : [];

      const nominee = nominees.find((n) => n.playerId === request.playerId);
      if (!nominee) throw new Error("PLAYER_NOT_NOMINATED");

      const basePrice = new Prisma.Decimal(nominee.basePrice);
      const bidDecimal = new Prisma.Decimal(request.bidAmount);

      // Prevent bidding on a player already purchased into any squad for this tournament.
      const alreadyInSquad = await tx.teamSquadPlayer.findFirst({
        where: { tournamentId, playerId: request.playerId, isActive: true },
        select: { id: true },
      });
      if (alreadyInSquad) throw new Error("PLAYER_ALREADY_SOLD");

      const team = await tx.team.findFirst({
        where: { id: request.teamId, tournamentId },
      });
      if (!team) throw new Error("TEAM_NOT_IN_TOURNAMENT");

      if (Number(team.purseRemaining) < request.bidAmount) throw new Error("INSUFFICIENT_PURSE");

      const minIncrement = new Prisma.Decimal(round.auctionSeries.minBidIncrement);
      const highestBid = await tx.auctionBid.findFirst({
        where: {
          tournamentId,
          auctionSeriesId: round.auctionSeriesId,
          auctionRoundId: request.auctionRoundId,
          playerId: request.playerId,
        },
        orderBy: { bidAmount: "desc" },
      });

      if (!highestBid) {
        if (bidDecimal.lt(basePrice)) {
          throw new Error(`BID_TOO_LOW_BASE:${basePrice.toString()}`);
        }
      } else {
        const minForNext = highestBid.bidAmount.add(minIncrement);
        if (bidDecimal.lt(minForNext)) {
          throw new Error(`BID_TOO_LOW:${minForNext.toString()}`);
        }
      }

      await tx.auctionBid.updateMany({
        where: {
          tournamentId,
          auctionSeriesId: round.auctionSeriesId,
          auctionRoundId: request.auctionRoundId,
          playerId: request.playerId,
          isWinningBid: true,
        },
        data: { isWinningBid: false },
      });

      return tx.auctionBid.create({
        data: {
          tournamentId,
          auctionSeriesId: round.auctionSeriesId,
          auctionRoundId: request.auctionRoundId,
          teamId: request.teamId,
          playerId: request.playerId,
          bidAmount: request.bidAmount,
          isWinningBid: true,
          placedByUserId: bidContext?.placedByUserId ?? undefined,
          ipAddress: bidContext?.ipAddress ?? undefined,
          userAgent: bidContext?.userAgent ?? undefined,
        },
        include: bidInclude,
      });
    });

    return { status: 201, body: successResponse(mapBidItem(result), "Bid placed") };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NO_ACTIVE_SERIES") {
        return { status: 400, body: errorResponse(ErrorCodes.BAD_REQUEST, "No active auction series found for this tournament") };
      }
      if (error.message === "ROUND_NOT_IN_SERIES") {
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Auction round does not belong to the active series") };
      }
      if (error.message === "ROUND_NOT_LIVE") {
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Bidding is not live for this round") };
      }
      if (error.message === "TEAM_NOT_IN_TOURNAMENT") {
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Team does not belong to this tournament") };
      }
      if (error.message === "INSUFFICIENT_PURSE") {
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Team does not have sufficient purse for this bid") };
      }
      if (error.message === "PLAYER_NOT_NOMINATED") {
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "This player is not nominated for the selected round") };
      }
      if (error.message === "PLAYER_NOT_ACTIVE") {
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Start this player's auction before placing bids") };
      }
      if (error.message === "PLAYER_ALREADY_SOLD") {
        return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "Player is already sold for this tournament") };
      }
      if (error.message.startsWith("BID_TOO_LOW:")) {
        const min = error.message.split(":")[1];
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, `Bid must be at least ${min}`) };
      }
      if (error.message.startsWith("BID_TOO_LOW_BASE:")) {
        const min = error.message.split(":")[1];
        return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, `Bid must be at least ${min} (base price)`) };
      }
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to place bid")) };
  }
}

export async function sellPlayer(
  tournamentId: string,
  payload: unknown,
  finalizeContext?: { finalizedByUserId?: string | null },
) {
  try {
    const body = asRecord(payload);
    const request: SellPlayerRequest = {
      auctionBidId: safeString(body.auctionBidId) ?? "",
    };

    if (!request.auctionBidId) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "auctionBidId is required") };
    }

    const result = await prisma.$transaction(async (tx) => {
      const bid = await tx.auctionBid.findUnique({
        where: { id: request.auctionBidId },
        include: bidInclude,
      });

      if (!bid) throw new Error("BID_NOT_FOUND");
      if (bid.tournamentId !== tournamentId) throw new Error("BID_NOT_FOR_TOURNAMENT");
      if (!bid.isWinningBid) throw new Error("BID_NOT_WINNING");

      const existingSale = await tx.auctionPlayerSale.findUnique({
        where: { auctionBidId: bid.id },
        select: { id: true },
      });
      if (existingSale) throw new Error("SALE_ALREADY_RECORDED");

      const round = bid.auctionRoundId ? await tx.auctionRound.findUnique({ where: { id: bid.auctionRoundId } }) : null;
      if (!round) throw new Error("ROUND_NOT_FOUND");
      if (!round.startsAt) throw new Error("ROUND_NOT_STARTED");

      const alreadySold = await tx.teamSquadPlayer.findFirst({
        where: { tournamentId, playerId: bid.playerId, isActive: true },
        select: { id: true },
      });
      if (alreadySold) throw new Error("PLAYER_ALREADY_SOLD");

      const player = bid.player;
      const team = await tx.team.findFirst({ where: { id: bid.teamId, tournamentId } });
      if (!team) throw new Error("TEAM_NOT_IN_TOURNAMENT");
      if (Number(team.purseRemaining) < Number(bid.bidAmount)) throw new Error("INSUFFICIENT_PURSE");

      await tx.teamSquadPlayer.create({
        data: {
          tournamentId,
          teamId: bid.teamId,
          playerId: bid.playerId,
          acquisitionType: "AUCTION",
          acquisitionAmount: bid.bidAmount,
          isOverseas: player.isOverseas,
        },
      });

      const newSpent = team.purseSpent.add(bid.bidAmount);
      const newRemaining = team.purseTotal.sub(newSpent);
      await tx.team.update({
        where: { id: bid.teamId },
        data: { purseSpent: newSpent, purseRemaining: newRemaining },
      });

      await tx.teamPurseLedger.create({
        data: {
          teamId: bid.teamId,
          tournamentId,
          amount: bid.bidAmount,
          direction: "DEBIT",
          transactionType: "AUCTION_PURCHASE",
          referenceType: "AUCTION_BID",
          referenceId: bid.id,
          balanceAfter: newRemaining,
          remarks: `Purchased ${player.displayName} for ${bid.bidAmount.toString()}`,
        },
      });

      await tx.auctionSeries.update({
        where: { id: bid.auctionSeriesId },
        data: {
          totalPlayersSold: { increment: 1 },
          totalAmountSpent: { increment: bid.bidAmount },
        },
      });

      await tx.auctionRound.update({
        where: { id: round.id },
        data: {
          playersSold: { increment: 1 },
          amountSpent: { increment: bid.bidAmount },
          activePlayerId: round.activePlayerId === bid.playerId ? null : undefined,
          activeAt: round.activePlayerId === bid.playerId ? null : undefined,
        },
      });

      await tx.auctionPlayerSale.create({
        data: {
          tournamentId,
          auctionSeriesId: bid.auctionSeriesId,
          auctionRoundId: round.id,
          auctionBidId: bid.id,
          playerId: bid.playerId,
          teamId: bid.teamId,
          soldPrice: bid.bidAmount,
          soldAt: new Date(),
          finalizedByUserId: finalizeContext?.finalizedByUserId ?? undefined,
        },
      });

      const withUser = await tx.auctionBid.findUnique({
        where: { id: bid.id },
        include: bidInclude,
      });
      return withUser ?? bid;
    });

    return { status: 200, body: successResponse(mapBidItem(result), "Player sold successfully") };
  } catch (error) {
    if (error instanceof Error && error.message === "TEAM_NOT_IN_TOURNAMENT") {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Team does not belong to this tournament") };
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_PURSE") {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Team does not have sufficient purse for this purchase") };
    }
    if (error instanceof Error && error.message === "BID_NOT_WINNING") {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Only the winning bid can be sold") };
    }
    if (error instanceof Error && error.message === "ROUND_NOT_STARTED") {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "Round has not started yet") };
    }
    if (error instanceof Error && error.message === "PLAYER_ALREADY_SOLD") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "Player is already sold for this tournament") };
    }
    if (error instanceof Error && error.message === "SALE_ALREADY_RECORDED") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "This winning bid has already been finalized") };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { status: 409, body: errorResponse(ErrorCodes.ALREADY_EXISTS, "Player is already in a squad for this tournament") };
    }
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to sell player")) };
  }
}

export async function listAuctionSales(tournamentId: string, auctionSeriesId?: string) {
  try {
    const where: Prisma.AuctionPlayerSaleWhereInput = { tournamentId };
    if (auctionSeriesId) where.auctionSeriesId = auctionSeriesId;

    const rows = await prisma.auctionPlayerSale.findMany({
      where,
      orderBy: [{ soldAt: "desc" }],
      include: {
        team: { select: { name: true, code: true } },
        player: { select: { displayName: true } },
        auctionSeries: { select: { name: true, sequenceNo: true } },
        auctionRound: { select: { name: true, roundNo: true, type: true } },
        finalizedBy: { select: { displayName: true } },
        auctionBid: { select: { bidAt: true, isAutoBid: true, paddleNumber: true } },
      },
    });

    const data: AuctionSaleItem[] = rows.map((r) => ({
      id: r.id,
      tournamentId: r.tournamentId,
      auctionSeriesId: r.auctionSeriesId,
      auctionRoundId: r.auctionRoundId,
      auctionBidId: r.auctionBidId,
      playerId: r.playerId,
      playerName: r.player.displayName,
      teamId: r.teamId,
      teamName: r.team.name,
      teamCode: r.team.code,
      soldPrice: r.soldPrice.toString(),
      soldAt: r.soldAt.toISOString(),
      finalizedByUserId: r.finalizedByUserId,
      finalizedByDisplayName: r.finalizedBy?.displayName ?? null,
      seriesName: r.auctionSeries.name,
      seriesSequenceNo: r.auctionSeries.sequenceNo,
      roundName: r.auctionRound.name,
      roundNo: r.auctionRound.roundNo,
      roundType: r.auctionRound.type,
      winningBidAt: r.auctionBid.bidAt.toISOString(),
      isAutoBid: r.auctionBid.isAutoBid,
      paddleNumber: r.auctionBid.paddleNumber,
    }));

    return { status: 200, body: successResponse(data) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load sale history")) };
  }
}
