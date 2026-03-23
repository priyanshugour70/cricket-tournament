"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { Mail } from "lucide-react";
import {
  Badge,
  Card,
  CardContent,
  Skeleton,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui";

type EmailLog = {
  id: string;
  to: string;
  subject: string;
  status: string;
  createdAt: string;
  error?: string;
};

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("auth_token")
      : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

const statusColor: Record<string, string> = {
  SENT: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  FAILED: "bg-red-100 text-red-800",
  DELIVERED: "bg-green-100 text-green-800",
  BOUNCED: "bg-red-100 text-red-800",
};

export default function EmailLogsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/email-logs`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      if (data.success) setLogs(data.data ?? []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Email Logs</h1>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Mail className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No emails sent</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Email logs will appear here once emails are dispatched.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>To</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="max-w-[200px] truncate font-medium">
                    {log.to}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {log.subject}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor[log.status] ?? ""}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
