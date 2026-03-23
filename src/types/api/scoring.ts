import type { APIResponse } from "@/types";

export interface InningsItem {
  id: string;
  matchId: string;
  inningsNo: number;
  battingTeamId: string;
  battingTeamName: string;
  bowlingTeamId: string;
  bowlingTeamName: string;
  status: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: string;
  extras: number;
  runRate: string;
  targetScore: number | null;
}

export interface AddBallRequest {
  overNo: number;
  ballNo: number;
  batsmanId: string;
  bowlerId: string;
  nonStrikerId?: string;
  runs: number;
  isExtra?: boolean;
  extraType?: string;
  extraRuns?: number;
  isWicket?: boolean;
  dismissalType?: string;
  dismissedId?: string;
  fielderId?: string;
  isFour?: boolean;
  isSix?: boolean;
  isFreeHit?: boolean;
}

export interface BallItem {
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
}

export interface CommentaryItem {
  id: string;
  overNo: number;
  ballNo: number | null;
  text: string;
  isHighlight: boolean;
  createdAt: string;
}

export interface AddCommentaryRequest {
  overNo: number;
  ballNo?: number;
  text: string;
  isHighlight?: boolean;
}

export type ListInningsResponse = APIResponse<InningsItem[]>;
export type CreateInningsResponse = APIResponse<InningsItem>;
export type ListBallsResponse = APIResponse<BallItem[]>;
export type AddBallResponse = APIResponse<BallItem>;
export type ListCommentaryResponse = APIResponse<CommentaryItem[]>;
