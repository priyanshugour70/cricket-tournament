"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  Users,
  UserPlus,
  Gavel,
  Swords,
  Trophy,
  Mail,
  Bell,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Select, Separator } from "@/components/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui";
import { ScrollArea } from "@/components/ui";
import type { AuthUser, TournamentAccessItem } from "@/types/api/auth";

const NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, href: "" },
  { label: "Teams", icon: Shield, href: "/teams" },
  { label: "Players", icon: Users, href: "/players" },
  { label: "Registrations", icon: UserPlus, href: "/registrations" },
  { label: "Auction", icon: Gavel, href: "/auction" },
  { label: "Matches", icon: Swords, href: "/matches" },
  { label: "Points Table", icon: Trophy, href: "/points-table" },
  { label: "Email Logs", icon: Mail, href: "/email-logs" },
  { label: "Notifications", icon: Bell, href: "/notifications" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

interface DashboardSidebarProps {
  user: AuthUser;
  tournamentAccesses: TournamentAccessItem[];
  tournamentId: string;
  onTournamentChange: (id: string) => void;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function DashboardSidebar({
  user,
  tournamentAccesses,
  tournamentId,
  onTournamentChange,
  open,
  onClose,
  onLogout,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/${tournamentId}`;

  const initials =
    (user.firstName?.charAt(0) ?? "") + (user.lastName?.charAt(0) ?? "");

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">CT Pro</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="px-4 pb-2">
          <Select
            value={tournamentId}
            onChange={(e) => onTournamentChange(e.target.value)}
            className="h-9 text-xs font-medium"
          >
            {tournamentAccesses.map((a) => (
              <option key={a.tournamentId} value={a.tournamentId}>
                {a.tournamentName}
              </option>
            ))}
          </Select>
        </div>

        <Separator />

        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-0.5 px-3">
            {NAV_ITEMS.map((item) => {
              const href = `${basePath}${item.href}`;
              const isActive =
                item.href === ""
                  ? pathname === basePath
                  : pathname.startsWith(href);

              return (
                <Link
                  key={item.label}
                  href={href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <Separator />

        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
              <AvatarFallback className="text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
