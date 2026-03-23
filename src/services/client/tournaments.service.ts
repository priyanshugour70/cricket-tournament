import { apiGet, apiPost } from "@/services/client/api-client";
import type {
  CreateTeamResponse,
  CreateTeamRequest,
  CreateTournamentRequest,
  ListTournamentPlayersResponse,
  ListTournamentTeamsResponse,
  ListTournamentsResponse,
  RegisterPlayerRequest,
  RegisterPlayerResponse,
  TournamentDetailsResponse,
} from "@/types/api/tournaments";

export async function listTournamentsRequest(): Promise<ListTournamentsResponse> {
  return apiGet("/api/tournaments");
}

export async function getTournamentDetailsRequest(
  tournamentId: string,
): Promise<TournamentDetailsResponse> {
  return apiGet(`/api/tournaments/${tournamentId}`);
}

export async function createTournamentRequest(
  payload: CreateTournamentRequest,
): Promise<TournamentDetailsResponse> {
  return apiPost("/api/tournaments", payload);
}

export async function listTournamentTeamsRequest(
  tournamentId: string,
): Promise<ListTournamentTeamsResponse> {
  return apiGet(`/api/tournaments/${tournamentId}/teams`);
}

export async function createTournamentTeamRequest(
  tournamentId: string,
  payload: CreateTeamRequest,
): Promise<CreateTeamResponse> {
  return apiPost(`/api/tournaments/${tournamentId}/teams`, payload);
}

export async function listTournamentPlayersRequest(
  tournamentId: string,
): Promise<ListTournamentPlayersResponse> {
  return apiGet(`/api/tournaments/${tournamentId}/players`);
}

export async function registerTournamentPlayerRequest(
  tournamentId: string,
  payload: RegisterPlayerRequest,
): Promise<RegisterPlayerResponse> {
  return apiPost(`/api/tournaments/${tournamentId}/players`, payload);
}
