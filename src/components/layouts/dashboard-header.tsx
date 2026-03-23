"use client";

import { Menu, Bell, LogOut } from "lucide-react";
import { Button, Badge } from "@/components/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import type { AuthUser, TournamentAccessItem } from "@/types/api/auth";

interface DashboardHeaderProps {
  user: AuthUser;
  tournamentAccess: TournamentAccessItem | undefined;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export function DashboardHeader({
  user,
  tournamentAccess,
  onToggleSidebar,
  onLogout,
}: DashboardHeaderProps) {
  const initials =
    (user.firstName?.charAt(0) ?? "") + (user.lastName?.charAt(0) ?? "");

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/60 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleSidebar}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        {tournamentAccess && (
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold lg:text-base">
              {tournamentAccess.tournamentName}
            </h2>
            <Badge variant="secondary" className="text-[10px]">
              {tournamentAccess.role.replace(/_/g, " ")}
            </Badge>
          </div>
        )}
      </div>

      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
          3
        </span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 px-2">
            <Avatar className="h-8 w-8">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} />}
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline-block">
              {user.displayName}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>
            <p className="font-medium">{user.displayName}</p>
            <p className="text-xs font-normal text-muted-foreground">
              {user.email}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
