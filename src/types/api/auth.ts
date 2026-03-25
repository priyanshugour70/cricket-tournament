import type { APIResponse } from "@/types";

/** Optional: create a linked Player profile in the same signup flow */
export interface RegisterPlayerProfileInput {
  role: string;
  battingStyle?: string;
  bowlingStyle?: string;
  isOverseas?: boolean;
  isWicketKeeper?: boolean;
  nationality?: string;
  state?: string;
  city?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  displayName: string;
  phone?: string;
  /** When true, set systemRole to PLAYER after signup */
  registerAsPlayer?: boolean;
  /** Create Player row linked to this user (userId). Implies registerAsPlayer if omitted. */
  linkedPlayerProfile?: RegisterPlayerProfileInput;
}

export interface LinkedPlayerSummary {
  id: string;
  displayName: string;
  role: string;
  code: string | null;
}

export interface CreatePlayerProfileRequest {
  role: string;
  battingStyle?: string;
  bowlingStyle?: string;
  isOverseas?: boolean;
  isWicketKeeper?: boolean;
  nationality?: string;
  state?: string;
  city?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  systemRole: string;
}

export interface TournamentAccessItem {
  tournamentId: string;
  tournamentName: string;
  tournamentCode: string;
  role: string;
  teamId: string | null;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  /** Present after login/register/refresh; omitted from GET /api/auth/me */
  refreshToken?: string;
  tournamentAccesses: TournamentAccessItem[];
  /** Linked cricket Player entity when user has a player profile */
  linkedPlayer?: LinkedPlayerSummary | null;
  /** Permission keys granted to this user's system role (see Permission / SystemRolePermission). */
  permissions: string[];
}

export type LoginResponse = APIResponse<AuthResponse>;
export type RegisterResponse = APIResponse<AuthResponse>;
export type MeResponse = APIResponse<AuthResponse>;
export type RefreshResponse = APIResponse<AuthResponse>;
export type CreatePlayerProfileResponse = APIResponse<LinkedPlayerSummary>;
