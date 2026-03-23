"use client";

import { useEffect, useState, useCallback } from "react";
import { use } from "react";
import { Bell, Check } from "lucide-react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  Select,
  Skeleton,
} from "@/components/ui";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
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

const TYPES = ["ALL", "INFO", "WARNING", "ERROR", "SUCCESS"];

const typeBadge: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-800",
  WARNING: "bg-yellow-100 text-yellow-800",
  ERROR: "bg-red-100 text-red-800",
  SUCCESS: "bg-green-100 text-green-800",
};

export default function NotificationsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("ALL");

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/notifications`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      if (data.success) setNotifications(data.data ?? []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/tournaments/${tournamentId}/notifications/${id}/read`, {
        method: "POST",
        headers: authHeaders(),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch {
      /* empty */
    }
  }

  const filtered =
    typeFilter === "ALL"
      ? notifications
      : notifications.filter((n) => n.type === typeFilter);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">
          Notifications ({filtered.length})
        </h1>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-40"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t === "ALL" ? "All Types" : t}
            </option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Bell className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-medium">No notifications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => (
            <Card
              key={n.id}
              className={n.isRead ? "opacity-70" : "border-primary/20"}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    <Badge className={typeBadge[n.type] ?? "bg-muted text-muted-foreground"}>
                      {n.type}
                    </Badge>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {n.message}
                  </p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markAsRead(n.id)}
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
