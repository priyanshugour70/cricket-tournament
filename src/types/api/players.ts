import type {
  PlayerRole,
  BattingStyle,
  BowlingStyle,
} from "@prisma/client";
import type { APIResponse } from "@/types";

export interface PlayerListItem {
  id: string;
  code: string | null;
  displayName: string;
  role: PlayerRole;
  battingStyle: BattingStyle | null;
  bowlingStyle: BowlingStyle | null;
  isOverseas: boolean;
  isCapped: boolean;
  nationality: string | null;
  active: boolean;
  createdAt: string;
}

export interface PlayerDetail extends PlayerListItem {
  firstName: string;
  lastName: string | null;
  dateOfBirth: string | null;
  age: number | null;
  gender: string | null;
  state: string | null;
  city: string | null;
  isWicketKeeper: boolean;
  t20Matches: number;
  odiMatches: number;
  testMatches: number;
  battingRating: number;
  bowlingRating: number;
  fieldingRating: number;
  allRounderRating: number;
  reservePrice: string | null;
  basePrice: string | null;
  profilePhotoUrl: string | null;
  bio: string | null;
  email: string | null;
  phone: string | null;
}

export interface CreatePlayerRequest {
  firstName: string;
  lastName?: string;
  displayName: string;
  role: PlayerRole;
  battingStyle?: BattingStyle;
  bowlingStyle?: BowlingStyle;
  isOverseas?: boolean;
  isWicketKeeper?: boolean;
  isCapped?: boolean;
  nationality?: string;
  state?: string;
  city?: string;
  reservePrice?: number;
  basePrice?: number;
  email?: string;
  phone?: string;
  bio?: string;
}

export interface UpdatePlayerRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: PlayerRole;
  battingStyle?: BattingStyle;
  bowlingStyle?: BowlingStyle;
  isOverseas?: boolean;
  isWicketKeeper?: boolean;
  isCapped?: boolean;
  nationality?: string;
  state?: string;
  city?: string;
  reservePrice?: number;
  basePrice?: number;
  email?: string;
  phone?: string;
  bio?: string;
  active?: boolean;
}

export interface PlayerCareerMatchItem {
  matchId: string;
  tournamentName: string;
  matchNo: number;
  homeTeamName: string;
  awayTeamName: string;
  status: string;
  resultSummary: string | null;
  scheduledAt: string | null;
}

export interface PlayerCareerBallItem {
  id: string;
  matchId: string;
  tournamentName: string;
  homeTeamName: string;
  awayTeamName: string;
  inningsNo: number;
  overNo: number;
  ballNo: number;
  involvement: "batsman" | "bowler" | "dismissed";
  runs: number;
  totalRuns: number;
  isWicket: boolean;
  isFour: boolean;
  isSix: boolean;
  extraType: string | null;
  createdAt: string;
}

export interface PlayerCareer {
  playerId: string;
  displayName: string;
  runsOffBat: number;
  ballsAsBatsman: number;
  dismissalsAsBatsman: number;
  wicketsAsBowler: number;
  runsConcededOffBat: number;
  ballsAsBowler: number;
  fours: number;
  sixes: number;
  squadAssignments: number;
  recentMatches: PlayerCareerMatchItem[];
  recentBallInvolvement: PlayerCareerBallItem[];
}

export type ListPlayersResponse = APIResponse<PlayerListItem[]>;
export type PlayerDetailResponse = APIResponse<PlayerDetail>;
export type CreatePlayerResponse = APIResponse<PlayerDetail>;
export type UpdatePlayerResponse = APIResponse<PlayerDetail>;
export type PlayerCareerResponse = APIResponse<PlayerCareer>;
