import { apiGet, apiPatch, apiPost } from "@/services/client/api-client";
import type {
  CreatePlayerRequest,
  CreatePlayerResponse,
  ListPlayersResponse,
  PlayerDetailResponse,
  UpdatePlayerRequest,
  UpdatePlayerResponse,
} from "@/types/api/players";

export async function listPlayersRequest(filters?: {
  role?: string;
  nationality?: string;
  active?: boolean;
}): Promise<ListPlayersResponse> {
  const params = new URLSearchParams();
  if (filters?.role) params.set("role", filters.role);
  if (filters?.nationality) params.set("nationality", filters.nationality);
  if (filters?.active !== undefined) params.set("active", String(filters.active));
  const qs = params.toString();
  return apiGet(`/api/players${qs ? `?${qs}` : ""}`);
}

export async function getPlayerDetailRequest(
  playerId: string,
): Promise<PlayerDetailResponse> {
  return apiGet(`/api/players/${playerId}`);
}

export async function createPlayerRequest(
  payload: CreatePlayerRequest,
): Promise<CreatePlayerResponse> {
  return apiPost("/api/players", payload);
}

export async function updatePlayerRequest(
  playerId: string,
  payload: UpdatePlayerRequest,
): Promise<UpdatePlayerResponse> {
  return apiPatch(`/api/players/${playerId}`, payload);
}
