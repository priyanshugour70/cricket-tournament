import { apiGet, apiPatch, apiPost } from "@/services/client/api-client";
import type {
  CreateMatchRequest,
  CreateMatchResponse,
  ListMatchesResponse,
  UpdateMatchResultRequest,
  UpdateMatchResultResponse,
} from "@/types/api/matches";

export async function listTournamentMatchesRequest(
  tournamentId: string,
): Promise<ListMatchesResponse> {
  return apiGet(`/api/tournaments/${tournamentId}/matches`);
}

export async function createTournamentMatchRequest(
  tournamentId: string,
  payload: CreateMatchRequest,
): Promise<CreateMatchResponse> {
  return apiPost(`/api/tournaments/${tournamentId}/matches`, payload);
}

export async function updateMatchResultRequest(
  tournamentId: string,
  matchId: string,
  payload: UpdateMatchResultRequest,
): Promise<UpdateMatchResultResponse> {
  return apiPatch(`/api/tournaments/${tournamentId}/matches/${matchId}/result`, payload);
}
