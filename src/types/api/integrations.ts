import type { APIResponse } from "@/types";

export interface HealthData {
  now: string;
}

export type HealthResponse = APIResponse<HealthData>;

export interface SendMailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  title?: string;
  message?: string;
  messageHtml?: string;
  footerText?: string;
}

export interface SendMailData {
  messageId: string;
  emailLogId: string;
}

export type SendMailResponse = APIResponse<SendMailData>;

export interface CreateS3PresignRequest {
  key?: string;
  contentType?: string;
  expiresInSeconds?: number;
}

export interface CreateS3PresignData {
  url: string;
  bucket: string;
  key: string;
}

export type CreateS3PresignResponse = APIResponse<CreateS3PresignData>;

