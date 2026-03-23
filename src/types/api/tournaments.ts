import type {
  BattingStyle,
  BowlingStyle,
  PlayerRole,
  RegistrationStatus,
  TeamStatus,
  TournamentFormat,
  TournamentStatus,
} from "@prisma/client";
import type { APIResponse } from "@/types";

export interface TournamentListItem {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  season: number;
  status: TournamentStatus;
  format: TournamentFormat;
  teamCount: number;
  playerRegistrationCount: number;
  matchCount: number;
  startsOn: string | null;
  endsOn: string | null;
  pursePerTeam: string;
  createdAt: string;
}

export interface TournamentDetails extends TournamentListItem {
  organizerName: string | null;
  organizerEmail: string | null;
  venueCity: string | null;
  country: string | null;
  timezone: string;
  maxTeams: number;
  minSquadSize: number;
  maxSquadSize: number;
  overseasLimit: number;
  notes: string | null;
}

export interface CreateTournamentRequest {
  code: string;
  name: string;
  shortName?: string;
  season: number;
  format?: TournamentFormat;
  status?: TournamentStatus;
  organizerName?: string;
  organizerEmail?: string;
  venueCity?: string;
  country?: string;
  timezone?: string;
  startsOn?: string;
  endsOn?: string;
  maxTeams?: number;
  minSquadSize?: number;
  maxSquadSize?: number;
  overseasLimit?: number;
  pursePerTeam: number;
  notes?: string;
}

export interface TeamListItem {
  id: string;
  tournamentId: string;
  code: string;
  name: string;
  shortName: string | null;
  status: TeamStatus;
  city: string | null;
  purseTotal: string;
  purseSpent: string;
  purseRemaining: string;
  squadCount: number;
}

export interface CreateTeamRequest {
  code: string;
  name: string;
  shortName?: string;
  ownerName?: string;
  managerName?: string;
  coachName?: string;
  city?: string;
  homeGround?: string;
  logoUrl?: string;
  status?: TeamStatus;
  purseTotal: number;
  squadMin?: number;
  squadMax?: number;
  overseasMin?: number;
  overseasMax?: number;
  contactEmail?: string;
  contactPhone?: string;
}

export interface TournamentPlayerItem {
  registrationId: string;
  registrationNumber: string;
  status: RegistrationStatus;
  playerId: string;
  displayName: string;
  role: PlayerRole;
  battingStyle: BattingStyle | null;
  bowlingStyle: BowlingStyle | null;
  isOverseas: boolean;
  expectedPrice: string | null;
  createdAt: string;
}

export interface RegisterPlayerRequest {
  playerId?: string;
  firstName?: string;
  lastName?: string;
  displayName: string;
  role: PlayerRole;
  battingStyle?: BattingStyle;
  bowlingStyle?: BowlingStyle;
  isOverseas?: boolean;
  isWicketKeeper?: boolean;
  nationality?: string;
  state?: string;
  city?: string;
  reservePrice?: number;
  basePrice?: number;
  expectedPrice?: number;
  registrationNumber?: string;
}

export type ListTournamentsResponse = APIResponse<TournamentListItem[]>;
export type TournamentDetailsResponse = APIResponse<TournamentDetails>;
export type CreateTournamentResponse = APIResponse<TournamentDetails>;
export type ListTournamentTeamsResponse = APIResponse<TeamListItem[]>;
export type CreateTeamResponse = APIResponse<TeamListItem>;
export type ListTournamentPlayersResponse = APIResponse<TournamentPlayerItem[]>;
export type RegisterPlayerResponse = APIResponse<TournamentPlayerItem>;

