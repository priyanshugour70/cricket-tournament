import { successResponse, type APIResponse } from "@/types";
import type { HealthData } from "@/types/api/integrations";

export function getHealthResponse(): APIResponse<HealthData> {
  return successResponse({ now: new Date().toISOString() }, "Healthy");
}

