"use client";

import { useApiAction } from "@/hooks/use-api-action";
import {
  createPlayerRequest,
  getPlayerDetailRequest,
  listPlayersRequest,
  updatePlayerRequest,
} from "@/services/client/players.service";
import type { CreatePlayerRequest, UpdatePlayerRequest } from "@/types/api/players";

export function useListPlayers() {
  return useApiAction(
    (filters?: { role?: string; nationality?: string; active?: boolean }) =>
      listPlayersRequest(filters),
  );
}

export function usePlayerDetail() {
  return useApiAction((playerId: string) => getPlayerDetailRequest(playerId));
}

export function useCreatePlayer() {
  return useApiAction((payload: CreatePlayerRequest) =>
    createPlayerRequest(payload),
  );
}

export function useUpdatePlayer() {
  return useApiAction(
    ({ playerId, payload }: { playerId: string; payload: UpdatePlayerRequest }) =>
      updatePlayerRequest(playerId, payload),
  );
}
