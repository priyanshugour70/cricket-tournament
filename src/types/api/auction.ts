import type { APIResponse } from "@/types";

export interface AuctionSeriesItem {
  id: string;
  tournamentId: string;
  name: string;
  sequenceNo: number;
  status: string;
  minBidIncrement: string;
  totalPlayersSold: number;
  totalAmountSpent: string;
  startsAt: string | null;
  endsAt: string | null;
  roundCount: number;
}

export interface CreateAuctionSeriesRequest {
  name: string;
  sequenceNo: number;
  minBidIncrement?: number;
  defaultBidTimeSec?: number;
  maxBidTimeSec?: number;
}

export interface AuctionRoundItem {
  id: string;
  auctionSeriesId: string;
  roundNo: number;
  name: string;
  type: string;
  maxPlayers: number | null;
  activePlayerId: string | null;
  activeAt: string | null;
  playersSold: number;
  amountSpent: string;
  startsAt: string | null;
  endsAt: string | null;
  nominees: { playerId: string; basePrice: string }[];
}

export interface CreateAuctionRoundRequest {
  roundNo: number;
  name: string;
  type: string;
  maxPlayers?: number;
  /** Players that are eligible for bidding in this round. */
  playerIds?: string[];
}

export interface PlaceBidRequest {
  teamId: string;
  playerId: string;
  bidAmount: number;
  auctionRoundId?: string;
}

export interface BidItem {
  id: string;
  teamId: string;
  teamName: string;
  playerId: string;
  playerName: string;
  bidAmount: string;
  isWinningBid: boolean;
  bidAt: string;
  auctionRoundId: string | null;
  placedByUserId: string | null;
  placedByDisplayName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuctionSaleItem {
  id: string;
  tournamentId: string;
  auctionSeriesId: string;
  auctionRoundId: string;
  auctionBidId: string;
  playerId: string;
  playerName: string;
  teamId: string;
  teamName: string;
  teamCode: string | null;
  soldPrice: string;
  soldAt: string;
  finalizedByUserId: string | null;
  finalizedByDisplayName: string | null;
  seriesName: string;
  seriesSequenceNo: number;
  roundName: string;
  roundNo: number;
  roundType: string;
  winningBidAt: string;
  isAutoBid: boolean;
  paddleNumber: string | null;
}

export interface SellPlayerRequest {
  auctionBidId: string;
}

export type ListAuctionSeriesResponse = APIResponse<AuctionSeriesItem[]>;
export type CreateAuctionSeriesResponse = APIResponse<AuctionSeriesItem>;
export type ListAuctionRoundsResponse = APIResponse<AuctionRoundItem[]>;
export type ListBidsResponse = APIResponse<BidItem[]>;
export type PlaceBidResponse = APIResponse<BidItem>;
export type ListAuctionSalesResponse = APIResponse<AuctionSaleItem[]>;
