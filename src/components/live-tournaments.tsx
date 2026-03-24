"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { TournamentListItem } from "@/types/api/tournaments";
import type { APIResponse } from "@/types";

function statusStyle(status: string) {
  switch (status) {
    case "LIVE":
      return "bg-red-500/10 text-red-700 border-red-200";
    case "REGISTRATION_OPEN":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

function fmtStatus(s: string) {
  return s.replace(/_/g, " ");
}

export function LiveTournaments() {
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((json: APIResponse<TournamentListItem[]>) => {
        if (json.success && json.data) {
          const live = json.data
            .filter((t) =>
              ["LIVE", "REGISTRATION_OPEN", "AUCTION_IN_PROGRESS", "SCHEDULE_READY"].includes(
                t.status,
              ),
            )
            .slice(0, 4);
          setTournaments(live);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!loading && tournaments.length === 0) return null;

  return (
    <section className="border-t border-border py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Live Tournaments
            </h2>
            <p className="mt-2 text-muted-foreground">
              Happening now or opening soon
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/tournaments">
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {tournaments.map((t) => (
              <Link key={t.id} href={`/tournaments/${t.id}`}>
                <Card className="h-full transition-all hover:shadow-md hover:border-ring/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="truncate text-base">
                        {t.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 text-[10px]",
                          statusStyle(t.status),
                        )}
                      >
                        {t.status === "LIVE" && (
                          <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                        )}
                        {fmtStatus(t.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-[10px]">
                        {t.format}
                      </Badge>
                      <span>Season {t.season}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t.teamCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {t.matchCount}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
