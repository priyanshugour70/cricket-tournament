import { NextResponse } from "next/server";
import { buildBasicEmailHtml, sendMail } from "@/lib/mail-utils";

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

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const toRaw = body.to;
    const subject = safeString(body.subject);

    const to: string | string[] =
      typeof toRaw === "string"
        ? toRaw
        : Array.isArray(toRaw) && toRaw.every((x) => typeof x === "string")
          ? (toRaw as string[])
          : [];

    if (!to.length) {
      return NextResponse.json(
        { ok: false, error: "`to` must be a string or string[]" },
        { status: 400 },
      );
    }
    if (!subject) {
      return NextResponse.json(
        { ok: false, error: "`subject` is required" },
        { status: 400 },
      );
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
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

