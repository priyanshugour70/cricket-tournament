"use client";

import { useApiAction } from "@/hooks/use-api-action";
import {
  createTournamentRequest,
  createTournamentTeamRequest,
  getTournamentDetailsRequest,
  listTournamentPlayersRequest,
  listTournamentTeamsRequest,
  listTournamentsRequest,
  registerTournamentPlayerRequest,
} from "@/services/client/tournaments.service";
import type {
  CreateTeamRequest,
  CreateTournamentRequest,
  RegisterPlayerRequest,
} from "@/types/api/tournaments";

export function useListTournaments() {
  return useApiAction(() => listTournamentsRequest());
}

export function useTournamentDetails() {
  return useApiAction((tournamentId: string) =>
    getTournamentDetailsRequest(tournamentId),
  );
}

export function useCreateTournament() {
  return useApiAction((payload: CreateTournamentRequest) =>
    createTournamentRequest(payload),
  );
}

export function useListTournamentTeams() {
  return useApiAction((tournamentId: string) =>
    listTournamentTeamsRequest(tournamentId),
  );
}

export function useCreateTournamentTeam() {
  return useApiAction(
    ({ tournamentId, payload }: { tournamentId: string; payload: CreateTeamRequest }) =>
      createTournamentTeamRequest(tournamentId, payload),
  );
}

export function useListTournamentPlayers() {
  return useApiAction((tournamentId: string) =>
    listTournamentPlayersRequest(tournamentId),
  );
}

export function useRegisterTournamentPlayer() {
  return useApiAction(
    ({
      tournamentId,
      payload,
    }: {
      tournamentId: string;
      payload: RegisterPlayerRequest;
    }) => registerTournamentPlayerRequest(tournamentId, payload),
  );
}

