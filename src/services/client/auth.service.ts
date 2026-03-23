import { apiPost } from "@/services/client/api-client";
import { getErrorMessage } from "@/types";
import type {
  AuthResponse,
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/types/api/auth";

export async function registerRequest(
  payload: RegisterRequest,
): Promise<RegisterResponse> {
  return apiPost<AuthResponse, RegisterRequest>("/api/auth/register", payload);
}

export async function loginRequest(
  payload: LoginRequest,
): Promise<LoginResponse> {
  return apiPost<AuthResponse, LoginRequest>("/api/auth/login", payload);
}

export async function getMeRequest(token: string): Promise<MeResponse> {
  const response = await fetch("/api/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = (await response.json().catch(() => ({}))) as MeResponse;
  if (!response.ok || !json.success) {
    throw new Error(getErrorMessage(json, "Request failed"));
  }
  return json;
}
