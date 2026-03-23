"use client";

import { useApiAction } from "@/hooks/use-api-action";
import {
  createTournamentMatchRequest,
  listTournamentMatchesRequest,
  updateMatchResultRequest,
} from "@/services/client/matches.service";
import type { CreateMatchRequest, UpdateMatchResultRequest } from "@/types/api/matches";

export function useListTournamentMatches() {
  return useApiAction((tournamentId: string) =>
    listTournamentMatchesRequest(tournamentId),
  );
}

export function useCreateTournamentMatch() {
  return useApiAction(
    ({ tournamentId, payload }: { tournamentId: string; payload: CreateMatchRequest }) =>
      createTournamentMatchRequest(tournamentId, payload),
  );
}

export function useUpdateMatchResult() {
  return useApiAction(
    ({
      tournamentId,
      matchId,
      payload,
    }: {
      tournamentId: string;
      matchId: string;
      payload: UpdateMatchResultRequest;
    }) => updateMatchResultRequest(tournamentId, matchId, payload),
  );
}
