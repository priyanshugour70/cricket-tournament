"use client";

import { useState } from "react";
import { useCreateS3Presign, useSendMail } from "@/hooks/use-integrations";
import { getErrorMessage } from "@/types";

type ApiState = { ok: boolean; message: string } | null;

export default function Home() {
  const [mailTo, setMailTo] = useState("test@example.com");
  const [mailSubject, setMailSubject] = useState(
    "Cricket Tournament - HTML email test",
  );
  const [mailMessageHtml, setMailMessageHtml] = useState(
    `<p>Hello from <b>Next.js</b>!</p><p>This is a test email with HTML.</p>`,
  );
  const [mailFooterText, setMailFooterText] = useState(
    "Thanks for checking the integration.",
  );
  const [mailState, setMailState] = useState<ApiState>(null);
  const sendMail = useSendMail();

  const [s3ContentType, setS3ContentType] = useState(
    "application/octet-stream",
  );
  const [s3ExpiresInSeconds, setS3ExpiresInSeconds] = useState(900);
  const [s3Key, setS3Key] = useState("");
  const [s3State, setS3State] = useState<ApiState>(null);
  const createS3Presign = useCreateS3Presign();

  // Keep placeholders deterministic to avoid SSR/client hydration mismatches.
  const previewKey = "uploads/frontend-demo";

  async function onSendMail(e: React.FormEvent) {
    e.preventDefault();
    setMailState(null);
    try {
      const result = await sendMail.execute({
        to: mailTo,
        subject: mailSubject,
        title: mailSubject,
        messageHtml: mailMessageHtml,
        footerText: mailFooterText,
      });

      setMailState({
        ok: true,
        message: `Email sent. messageId=${result.data?.messageId ?? "unknown"}`,
      });
    } catch (err) {
      setMailState({ ok: false, message: getErrorMessage(err) });
    }
  }

  async function onGetPresignUrl(e: React.FormEvent) {
    e.preventDefault();
    setS3State(null);
    try {
      const result = await createS3Presign.execute({
        key: s3Key.trim() ? s3Key.trim() : undefined,
        contentType: s3ContentType,
        expiresInSeconds: s3ExpiresInSeconds,
      });

      setS3State({
        ok: true,
        message: `Presigned URL created for key=${result.data?.key ?? previewKey}`,
      });

      console.log("S3 presigned response:", result.data);
    } catch (err) {
      setS3State({ ok: false, message: getErrorMessage(err) });
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="text-2xl font-semibold">Cricket Tournament Integrations</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Verify Prisma/Postgres, S3 presigning, and HTML email sending.
      </p>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">1) Send HTML Email</h2>
        <form onSubmit={onSendMail} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">To</span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              value={mailTo}
              onChange={(e) => setMailTo(e.target.value)}
              type="email"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Subject</span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              value={mailSubject}
              onChange={(e) => setMailSubject(e.target.value)}
              type="text"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">messageHtml</span>
            <textarea
              className="mt-1 h-28 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs"
              value={mailMessageHtml}
              onChange={(e) => setMailMessageHtml(e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">footerText</span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              value={mailFooterText}
              onChange={(e) => setMailFooterText(e.target.value)}
              type="text"
            />
          </label>

          <button
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
            type="submit"
            disabled={sendMail.isLoading}
          >
            {sendMail.isLoading ? "Sending..." : "Send Email"}
          </button>
        </form>

        {mailState ? (
          <p
            className={`mt-4 text-sm ${
              mailState.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {mailState.message}
          </p>
        ) : null}
      </section>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold">2) Get S3 Presigned URL</h2>
        <form onSubmit={onGetPresignUrl} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">key (optional)</span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs"
              value={s3Key}
              onChange={(e) => setS3Key(e.target.value)}
              type="text"
              placeholder={previewKey}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">contentType</span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-xs"
              value={s3ContentType}
              onChange={(e) => setS3ContentType(e.target.value)}
              type="text"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">expiresInSeconds</span>
            <input
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
              value={s3ExpiresInSeconds}
              onChange={(e) => setS3ExpiresInSeconds(Number(e.target.value))}
              type="number"
              min={60}
              max={3600}
            />
          </label>

          <button
            className="w-full rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
            type="submit"
            disabled={createS3Presign.isLoading}
          >
            {createS3Presign.isLoading ? "Creating..." : "Create Presigned URL"}
          </button>
        </form>

        {s3State ? (
          <p
            className={`mt-4 text-sm ${
              s3State.ok ? "text-green-600" : "text-red-600"
            }`}
          >
            {s3State.message}
          </p>
        ) : null}

        <p className="mt-3 text-xs text-zinc-500">
          The full presigned URL will be printed in the browser console.
        </p>
      </section>
    </main>
  );
}
