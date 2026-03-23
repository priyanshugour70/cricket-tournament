import nodemailer from "nodemailer";
import { prisma } from "./prisma";

let transporter:
  | ReturnType<typeof nodemailer.createTransport>
  | null = null;

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable: ${name}`);
  return v;
}

function getTransporter() {
  if (transporter) return transporter;

  const host = requireEnv("MAIL_HOST");
  const port = Number(process.env.MAIL_PORT ?? "587");
  const user = requireEnv("MAIL_USER");
  const pass = requireEnv("MAIL_PASSWORD");

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export type SendMailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
};

export function buildBasicEmailHtml(input: {
  title: string;
  bodyHtml: string;
  footerText?: string;
}) {
  const footer = input.footerText
    ? `<p style="margin: 0; font-size: 12px; color: #6b7280;">${input.footerText}</p>`
    : "";

  // Keep it simple but valid HTML for most SMTP clients.
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${input.title}</title>
  </head>
  <body style="margin:0; padding:0; background:#f4f4f5;">
    <div style="max-width:640px; margin:0 auto; padding:24px;">
      <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:12px; padding:20px;">
        <h2 style="margin:0 0 12px; font-family: Arial, Helvetica, sans-serif; color:#111827;">${input.title}</h2>
        <div style="font-family: Arial, Helvetica, sans-serif; color:#111827; font-size:14px; line-height:1.6;">
          ${input.bodyHtml}
        </div>
        <div style="height:16px;"></div>
        ${footer}
      </div>
      <p style="margin: 14px 0 0; text-align:center; font-size:12px; color:#9ca3af; font-family: Arial, Helvetica, sans-serif;">
        This email was sent by your Next.js sample project.
      </p>
    </div>
  </body>
</html>`;
}

export async function sendMail(input: SendMailInput) {
  const from = requireEnv("MAIL_FROM");
  const transporterInstance = getTransporter();

  const result = await transporterInstance.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    cc: input.cc,
    bcc: input.bcc,
    replyTo: input.replyTo,
  });

  const emailLog = await prisma.emailLog.create({
    data: {
      to: Array.isArray(input.to) ? input.to.join(",") : input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      status: "SENT",
    },
    select: { id: true },
  });

  return { messageId: result.messageId, emailLogId: emailLog.id };
}

