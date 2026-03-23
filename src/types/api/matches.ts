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

export type ListMatchesResponse = APIResponse<MatchListItem[]>;
export type CreateMatchResponse = APIResponse<MatchListItem>;
export type UpdateMatchResultResponse = APIResponse<MatchListItem>;
