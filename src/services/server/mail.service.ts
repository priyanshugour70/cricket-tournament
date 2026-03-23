import { buildBasicEmailHtml, sendMail } from "@/lib/mail-utils";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
  type APIResponse,
} from "@/types";
import type { SendMailData, SendMailRequest } from "@/types/api/integrations";

function safeString(v: unknown) {
  return typeof v === "string" ? v : undefined;
}

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseTo(raw: unknown): string | string[] | null {
  if (typeof raw === "string" && raw.length > 0) return raw;
  if (Array.isArray(raw) && raw.every((x) => typeof x === "string")) {
    const clean = raw.filter((x) => x.length > 0);
    return clean.length ? clean : null;
  }
  return null;
}

export async function sendMailFromPayload(
  payload: unknown,
): Promise<{ status: number; body: APIResponse<SendMailData> }> {
  try {
    const body = (payload ?? {}) as Record<string, unknown>;
    const to = parseTo(body.to);
    const subject = safeString(body.subject);

    if (!to) {
      return {
        status: 400,
        body: errorResponse(
          ErrorCodes.VALIDATION_ERROR,
          "`to` must be a string or string[]",
        ),
      };
    }
    if (!subject) {
      return {
        status: 400,
        body: errorResponse(ErrorCodes.VALIDATION_ERROR, "`subject` is required"),
      };
    }

    const htmlFromBody = safeString(body.html);
    const title = safeString(body.title) ?? subject;
    const messageHtml = safeString(body.messageHtml);
    const message = safeString(body.message);
    const footerText =
      safeString(body.footerText) ?? "Thanks for using the sample project.";

    const html =
      htmlFromBody ??
      buildBasicEmailHtml({
        title,
        bodyHtml: messageHtml ?? (message ? escapeHtml(message) : ""),
        footerText,
      });

    const text = safeString(body.text);

    const result = await sendMail({
      to,
      subject,
      html,
      text,
    } satisfies SendMailRequest);

    return {
      status: 200,
      body: successResponse(
        { messageId: result.messageId, emailLogId: result.emailLogId },
        "Email sent successfully",
      ),
    };
  } catch (error) {
    return {
      status: 400,
      body: errorResponse(
        ErrorCodes.BAD_REQUEST,
        getErrorMessage(error, "Unable to send email"),
      ),
    };
  }
}

