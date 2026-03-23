import type { RegistrationStatus } from "@prisma/client";
import type { APIResponse } from "@/types";

export interface ApproveRejectRequest {
  registrationId: string;
  action: "APPROVE" | "REJECT";
  rejectionReason?: string;
}

export interface RegistrationActionResult {
  registrationId: string;
  status: RegistrationStatus;
  playerId: string;
  displayName: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

export type ApproveRejectResponse = APIResponse<RegistrationActionResult>;
