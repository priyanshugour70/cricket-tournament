import { redirect } from "next/navigation";

export default async function RegistrationsPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = await params;
  redirect(`/dashboard/${tournamentId}/players`);
}
