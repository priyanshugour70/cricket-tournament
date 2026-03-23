import type { APIResponse } from "@/types";

export interface NotificationItem {
  id: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface CreateNotificationRequest {
  userId?: string;
  tournamentId?: string;
  type: string;
  channel?: string;
  title: string;
  message: string;
  link?: string;
}

export type ListNotificationsResponse = APIResponse<NotificationItem[]>;
export type UnreadCountResponse = APIResponse<{ count: number }>;
