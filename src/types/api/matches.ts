import type {
  MatchStage,
  MatchStatus,
  MatchResultType,
  TossDecision,
} from "@prisma/client";
import type { APIResponse } from "@/types";

export interface MatchListItem {
  id: string;
  tournamentId: string;
  matchNo: number;
  stage: MatchStage;
  groupName: string | null;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  venueName: string | null;
  city: string | null;
  scheduledAt: string | null;
  status: MatchStatus;
  winningTeamId: string | null;
  resultType: MatchResultType | null;
  resultSummary: string | null;
  createdAt: string;
}

export interface CreateMatchRequest {
  matchNo: number;
  stage?: MatchStage;
  groupName?: string;
  homeTeamId: string;
  awayTeamId: string;
  venueName?: string;
  city?: string;
  scheduledAt?: string;
  oversPerSide?: number;
  umpire1?: string;
  umpire2?: string;
  thirdUmpire?: string;
  referee?: string;
}

export interface UpdateMatchResultRequest {
  status?: MatchStatus;
  resultType?: MatchResultType;
  winningTeamId?: string;
  resultSummary?: string;
  winMarginRuns?: number;
  winMarginWickets?: number;
  tossWonByTeamId?: string;
  tossDecision?: TossDecision;
  pointsHome?: number;
  pointsAway?: number;
}

export interface MatchDetail extends MatchListItem {
  homeTeamCode: string;
  awayTeamCode: string;
  startedAt: string | null;
  completedAt: string | null;
  tossWonByTeamId: string | null;
  tossDecision: TossDecision | null;
  winMarginRuns: number | null;
  winMarginWickets: number | null;
  pointsHome: string | null;
  pointsAway: string | null;
  oversPerSide: string;
  umpire1: string | null;
  umpire2: string | null;
  thirdUmpire: string | null;
  referee: string | null;
  highlights: string | null;
}

export interface PlayingXIItem {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  playerName: string;
  slotNo: number;
  role: string | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketKeeper: boolean;
}

export interface SetPlayingXIRequest {
  teamId: string;
  players: Array<{
    playerId: string;
    slotNo: number;
    role?: string;
    isCaptain?: boolean;
    isViceCaptain?: boolean;
    isWicketKeeper?: boolean;
  }>;
}

export type MatchDetailResponse = APIResponse<MatchDetail>;
export type PlayingXIResponse = APIResponse<PlayingXIItem[]>;
export type ListMatchesResponse = APIResponse<MatchListItem[]>;
export type CreateMatchResponse = APIResponse<MatchListItem>;
export type UpdateMatchResultResponse = APIResponse<MatchListItem>;
