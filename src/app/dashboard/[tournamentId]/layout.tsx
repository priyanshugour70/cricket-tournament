"use client";

import { use } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

export default function TournamentDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);
  return (
    <DashboardLayout tournamentId={tournamentId}>{children}</DashboardLayout>
  );
}
