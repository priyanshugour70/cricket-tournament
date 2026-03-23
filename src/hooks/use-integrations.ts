"use client";

import { useApiAction } from "@/hooks/use-api-action";
import {
  createS3PresignRequest,
  sendMailRequest,
} from "@/services/client/integrations.service";
import type {
  CreateS3PresignRequest,
  SendMailRequest,
} from "@/types/api/integrations";

export function useSendMail() {
  return useApiAction((input: SendMailRequest) => sendMailRequest(input));
}

export function useCreateS3Presign() {
  return useApiAction((input: CreateS3PresignRequest) =>
    createS3PresignRequest(input),
  );
}

