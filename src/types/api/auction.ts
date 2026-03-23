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
  playersSold: number;
  amountSpent: string;
}

export interface CreateAuctionRoundRequest {
  roundNo: number;
  name: string;
  type: string;
  maxPlayers?: number;
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
}

export interface SellPlayerRequest {
  playerId: string;
  teamId: string;
  soldPrice: number;
  auctionSeriesId: string;
  auctionRoundId?: string;
}

export type ListAuctionSeriesResponse = APIResponse<AuctionSeriesItem[]>;
export type CreateAuctionSeriesResponse = APIResponse<AuctionSeriesItem>;
export type ListAuctionRoundsResponse = APIResponse<AuctionRoundItem[]>;
export type ListBidsResponse = APIResponse<BidItem[]>;
export type PlaceBidResponse = APIResponse<BidItem>;
