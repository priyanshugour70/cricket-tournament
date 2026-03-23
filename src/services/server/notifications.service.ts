import { prisma } from "@/lib/prisma";
import { sendMail, buildBasicEmailHtml } from "@/lib/mail-utils";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";
import type {
  CreateNotificationRequest,
  NotificationItem,
} from "@/types/api/notifications";

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object") return payload as Record<string, unknown>;
  return {};
}
function safeString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

function mapNotificationItem(item: {
  id: string;
  type: string;
  channel: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date;
}): NotificationItem {
  return {
    id: item.id,
    type: item.type,
    channel: item.channel,
    title: item.title,
    message: item.message,
    link: item.link,
    isRead: item.isRead,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function listNotifications(userId?: string, tournamentId?: string) {
  try {
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (tournamentId) where.tournamentId = tournamentId;

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
    });
    return { status: 200, body: successResponse(notifications.map(mapNotificationItem)) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load notifications")) };
  }
}

export async function createNotification(payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: CreateNotificationRequest = {
      userId: safeString(body.userId),
      tournamentId: safeString(body.tournamentId),
      type: safeString(body.type) ?? "GENERAL",
      channel: safeString(body.channel) ?? "IN_APP",
      title: safeString(body.title) ?? "",
      message: safeString(body.message) ?? "",
      link: safeString(body.link),
    };

    if (!request.title || !request.message) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "title and message are required") };
    }

    const created = await prisma.notification.create({
      data: {
        userId: request.userId,
        tournamentId: request.tournamentId,
        type: request.type as "REGISTRATION_SUBMITTED" | "REGISTRATION_APPROVED" | "REGISTRATION_REJECTED" | "AUCTION_STARTED" | "AUCTION_PLAYER_SOLD" | "MATCH_SCHEDULED" | "MATCH_STARTED" | "MATCH_COMPLETED" | "TEAM_CREATED" | "GENERAL",
        channel: request.channel as "IN_APP" | "EMAIL" | "BOTH",
        title: request.title,
        message: request.message,
        link: request.link,
      },
    });

    if ((request.channel === "EMAIL" || request.channel === "BOTH") && request.userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: request.userId },
          select: { email: true },
        });
        if (user?.email) {
          const html = buildBasicEmailHtml({
            title: request.title,
            bodyHtml: `<p>${request.message}</p>`,
          });
          await sendMail({ to: user.email, subject: request.title, html });
          await prisma.notification.update({
            where: { id: created.id },
            data: { emailSent: true, emailSentAt: new Date() },
          });
        }
      } catch {
        // Email send failure should not fail notification creation
      }
    }

    return { status: 201, body: successResponse(mapNotificationItem(created), "Notification created") };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to create notification")) };
  }
}

export async function markAsRead(notificationId: string) {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Notification not found") };
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
    return { status: 200, body: successResponse(mapNotificationItem(updated), "Notification marked as read") };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to mark notification as read")) };
  }
}

export async function markAllAsRead(userId: string) {
  try {
    if (!userId) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "userId is required") };
    }

    const { count } = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { status: 200, body: successResponse({ count }, `${count} notifications marked as read`) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to mark notifications as read")) };
  }
}

export async function getUnreadCount(userId: string) {
  try {
    if (!userId) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "userId is required") };
    }

    const count = await prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { status: 200, body: successResponse({ count }) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to get unread count")) };
  }
}
