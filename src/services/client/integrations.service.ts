import { apiGet, apiPost } from "@/services/client/api-client";
import type {
  CreateS3PresignData,
  CreateS3PresignRequest,
  HealthData,
  SendMailData,
  SendMailRequest,
} from "@/types/api/integrations";

export async function sendMailRequest(input: SendMailRequest) {
  return apiPost<SendMailData, SendMailRequest>("/api/mail/send", input);
}

export async function createS3PresignRequest(input: CreateS3PresignRequest) {
  return apiPost<CreateS3PresignData, CreateS3PresignRequest>(
    "/api/s3/presign",
    input,
  );
}

export async function getHealthRequest() {
  return apiGet<HealthData>("/api/health");
}

