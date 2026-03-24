"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  Users,
  ChevronRight,
  Search,
} from "lucide-react";
import { MarketingHeader } from "@/components/layouts/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    case "REGISTRATION_CLOSED":
    case "AUCTION_SCHEDULED":
      return "bg-amber-500/10 text-amber-700 border-amber-200";
    case "AUCTION_IN_PROGRESS":
      return "bg-violet-500/10 text-violet-700 border-violet-200";
    case "AUCTION_COMPLETED":
    case "SCHEDULE_READY":
      return "bg-blue-500/10 text-blue-700 border-blue-200";
    case "COMPLETED":
      return "bg-stone-500/10 text-stone-500 border-stone-200";
    case "CANCELLED":
    case "ARCHIVED":
      return "bg-stone-100 text-stone-400 border-stone-200";
    default:
      return "bg-secondary text-secondary-foreground border-border";
  }
}

function fmtDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function fmtStatus(s: string) {
  return s.replace(/_/g, " ");
}

type Filter = "ALL" | "LIVE" | "UPCOMING" | "COMPLETED";

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((json: APIResponse<TournamentListItem[]>) => {
        if (json.success && json.data) setTournaments(json.data);
        else setError("Failed to load tournaments");
      })
      .catch(() => setError("Failed to load tournaments"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = tournaments;
    if (filter === "LIVE") {
      result = result.filter((t) =>
        ["LIVE", "AUCTION_IN_PROGRESS"].includes(t.status),
      );
    } else if (filter === "UPCOMING") {
      result = result.filter((t) =>
        [
          "DRAFT",
          "REGISTRATION_OPEN",
          "REGISTRATION_CLOSED",
          "AUCTION_SCHEDULED",
          "AUCTION_COMPLETED",
          "SCHEDULE_READY",
        ].includes(t.status),
      );
    } else if (filter === "COMPLETED") {
      result = result.filter((t) =>
        ["COMPLETED", "CANCELLED", "ARCHIVED"].includes(t.status),
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tournaments, filter, search]);

  return (
    <div className="flex min-h-screen flex-col">
      <MarketingHeader />

      <section className="border-b border-border bg-secondary/50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Browse Tournaments
          </h1>
          <p className="mt-2 text-muted-foreground">
            Explore cricket tournaments from around the world
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-background px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {(["ALL", "LIVE", "UPCOMING", "COMPLETED"] as Filter[]).map(
              (f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="shrink-0"
                >
                  {f === "ALL"
                    ? "All"
                    : f.charAt(0) + f.slice(1).toLowerCase()}
                </Button>
              ),
            )}
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tournaments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </section>

      <section className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="mt-2 h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mt-2 h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">
                No Tournaments Found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? "Try a different search term"
                  : "No tournaments match the selected filter"}
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t) => (
                <Link key={t.id} href={`/tournaments/${t.id}`}>
                  <Card className="h-full transition-all hover:shadow-md hover:border-ring/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="truncate">
                            {t.name}
                          </CardTitle>
                          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            {t.code}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "shrink-0 text-[11px]",
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
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {t.format}
                        </Badge>
                        <span>Season {t.season}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {t.teamCount} teams
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {t.matchCount} matches
                        </span>
                      </div>
                      {(t.startsOn || t.endsOn) && (
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(t.startsOn)}
                          {t.startsOn && t.endsOn && " — "}
                          {fmtDate(t.endsOn)}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        View Details
                        <ChevronRight className="h-3 w-3" />
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CricketTournament Pro. All rights
          reserved.
        </div>
      </footer>
    </div>
  );
}
