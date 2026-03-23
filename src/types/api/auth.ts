import type { APIResponse } from "@/types";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  displayName: string;
  phone?: string;
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
  tournamentAccesses: TournamentAccessItem[];
}

export type LoginResponse = APIResponse<AuthResponse>;
export type RegisterResponse = APIResponse<AuthResponse>;
export type MeResponse = APIResponse<AuthResponse>;
