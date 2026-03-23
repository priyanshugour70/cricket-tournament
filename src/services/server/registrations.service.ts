import { prisma } from "@/lib/prisma";
import { sendMail, buildBasicEmailHtml } from "@/lib/mail-utils";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";
import type {
  ApproveRejectRequest,
  RegistrationActionResult,
} from "@/types/api/registrations";

function asRecord(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object") return payload as Record<string, unknown>;
  return {};
}
function safeString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : undefined;
}

export async function approveRejectRegistration(tournamentId: string, payload: unknown) {
  try {
    const body = asRecord(payload);
    const request: ApproveRejectRequest = {
      registrationId: safeString(body.registrationId) ?? "",
      action: body.action as ApproveRejectRequest["action"],
      rejectionReason: safeString(body.rejectionReason),
    };

    if (!request.registrationId || !request.action) {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "registrationId and action are required") };
    }
    if (request.action !== "APPROVE" && request.action !== "REJECT") {
      return { status: 400, body: errorResponse(ErrorCodes.VALIDATION_ERROR, "action must be APPROVE or REJECT") };
    }

    const registration = await prisma.tournamentPlayerRegistration.findFirst({
      where: { id: request.registrationId, tournamentId },
      include: { player: { select: { id: true, displayName: true } } },
    });
    if (!registration) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Registration not found in this tournament") };
    }

    const now = new Date();
    const updated = await prisma.tournamentPlayerRegistration.update({
      where: { id: request.registrationId },
      data:
        request.action === "APPROVE"
          ? { status: "APPROVED", approvedAt: now, approvedBy: "system" }
          : { status: "REJECTED", rejectedAt: now, rejectedBy: "system", rejectionReason: request.rejectionReason },
      include: { player: { select: { id: true, displayName: true } } },
    });

    const result: RegistrationActionResult = {
      registrationId: updated.id,
      status: updated.status,
      playerId: updated.player.id,
      displayName: updated.player.displayName,
      approvedAt: updated.approvedAt?.toISOString() ?? null,
      rejectedAt: updated.rejectedAt?.toISOString() ?? null,
      rejectionReason: updated.rejectionReason,
    };

    const isApproved = request.action === "APPROVE";
    const notificationType = isApproved ? "REGISTRATION_APPROVED" : "REGISTRATION_REJECTED";
    const notificationTitle = isApproved
      ? "Registration Approved"
      : "Registration Rejected";
    const notificationMessage = isApproved
      ? `Your registration for the tournament has been approved.`
      : `Your registration has been rejected. ${request.rejectionReason ?? ""}`.trim();

    try {
      const player = await prisma.player.findUnique({
        where: { id: updated.player.id },
        select: { email: true },
      });

      await prisma.notification.create({
        data: {
          tournamentId,
          type: notificationType as "REGISTRATION_APPROVED" | "REGISTRATION_REJECTED",
          channel: player?.email ? "BOTH" : "IN_APP",
          title: notificationTitle,
          message: notificationMessage,
        },
      });

      if (player?.email) {
        const html = buildBasicEmailHtml({
          title: notificationTitle,
          bodyHtml: `<p>Hello ${updated.player.displayName},</p><p>${notificationMessage}</p>`,
        });
        await sendMail({ to: player.email, subject: notificationTitle, html });
      }
    } catch {
      // Notification/email failure should not fail the registration action
    }

    return {
      status: 200,
      body: successResponse(result, `Registration ${isApproved ? "approved" : "rejected"} successfully`),
    };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to process registration action")) };
  }
}
