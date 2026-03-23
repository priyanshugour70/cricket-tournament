"use client";

import { useApiAction } from "@/hooks/use-api-action";
import {
  loginRequest,
  registerRequest,
} from "@/services/client/auth.service";
import type { LoginRequest, RegisterRequest } from "@/types/api/auth";

export function useRegister() {
  return useApiAction((payload: RegisterRequest) => registerRequest(payload));
}

export function useLogin() {
  return useApiAction((payload: LoginRequest) => loginRequest(payload));
}
