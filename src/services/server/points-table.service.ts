import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ErrorCodes,
  errorResponse,
  getErrorMessage,
  successResponse,
} from "@/types";

export async function getPointsTable(tournamentId: string) {
  try {
    const entries = await prisma.pointsTableEntry.findMany({
      where: { tournamentId },
      orderBy: [{ points: "desc" }, { nrr: "desc" }],
      include: { team: { select: { name: true, code: true, shortName: true, logoUrl: true } } },
    });

    const data = entries.map((e) => ({
      id: e.id,
      tournamentId: e.tournamentId,
      teamId: e.teamId,
      teamName: e.team.name,
      teamCode: e.team.code,
      teamShortName: e.team.shortName,
      teamLogoUrl: e.team.logoUrl,
      played: e.played,
      won: e.won,
      lost: e.lost,
      tied: e.tied,
      noResult: e.noResult,
      points: e.points.toString(),
      nrr: e.nrr.toString(),
      runsScored: e.runsScored,
      oversFaced: e.oversFaced.toString(),
      runsConceded: e.runsConceded,
      oversBowled: e.oversBowled.toString(),
      position: e.position,
      groupName: e.groupName,
    }));

    return { status: 200, body: successResponse(data) };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to load points table")) };
  }
}

export async function recalculatePointsTable(tournamentId: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { pointsForWin: true, pointsForTie: true, pointsForNR: true },
    });
    if (!tournament) {
      return { status: 404, body: errorResponse(ErrorCodes.NOT_FOUND, "Tournament not found") };
    }

    const matches = await prisma.match.findMany({
      where: { tournamentId, status: "COMPLETED" },
      include: {
        innings: {
          select: { battingTeamId: true, bowlingTeamId: true, totalRuns: true, totalOvers: true },
        },
      },
    });

    const teams = await prisma.team.findMany({
      where: { tournamentId },
      select: { id: true },
    });

    const stats: Record<string, {
      played: number; won: number; lost: number; tied: number; noResult: number;
      runsScored: number; oversFaced: Prisma.Decimal;
      runsConceded: number; oversBowled: Prisma.Decimal;
    }> = {};

    for (const team of teams) {
      stats[team.id] = {
        played: 0, won: 0, lost: 0, tied: 0, noResult: 0,
        runsScored: 0, oversFaced: new Prisma.Decimal(0),
        runsConceded: 0, oversBowled: new Prisma.Decimal(0),
      };
    }

    for (const match of matches) {
      const homeId = match.homeTeamId;
      const awayId = match.awayTeamId;
      if (!stats[homeId] || !stats[awayId]) continue;

      stats[homeId].played++;
      stats[awayId].played++;

      if (match.resultType === "TEAM_WIN") {
        if (match.winningTeamId === homeId) {
          stats[homeId].won++;
          stats[awayId].lost++;
        } else {
          stats[awayId].won++;
          stats[homeId].lost++;
        }
      } else if (match.resultType === "TIE") {
        stats[homeId].tied++;
        stats[awayId].tied++;
      } else {
        stats[homeId].noResult++;
        stats[awayId].noResult++;
      }

      for (const inn of match.innings) {
        const battingTeam = inn.battingTeamId;
        const bowlingTeam = inn.bowlingTeamId;
        if (stats[battingTeam]) {
          stats[battingTeam].runsScored += inn.totalRuns;
          stats[battingTeam].oversFaced = stats[battingTeam].oversFaced.add(inn.totalOvers);
        }
        if (stats[bowlingTeam]) {
          stats[bowlingTeam].runsConceded += inn.totalRuns;
          stats[bowlingTeam].oversBowled = stats[bowlingTeam].oversBowled.add(inn.totalOvers);
        }
      }
    }

    const entries = Object.entries(stats).map(([teamId, s]) => {
      const points = new Prisma.Decimal(s.won).mul(tournament.pointsForWin)
        .add(new Prisma.Decimal(s.tied).mul(tournament.pointsForTie))
        .add(new Prisma.Decimal(s.noResult).mul(tournament.pointsForNR));

      const oversFacedNum = Number(s.oversFaced);
      const oversBowledNum = Number(s.oversBowled);
      const forRR = oversFacedNum > 0 ? s.runsScored / oversFacedNum : 0;
      const againstRR = oversBowledNum > 0 ? s.runsConceded / oversBowledNum : 0;
      const nrr = forRR - againstRR;

      return { teamId, points, nrr, ...s };
    });

    entries.sort((a, b) => {
      const pd = Number(b.points) - Number(a.points);
      if (pd !== 0) return pd;
      return b.nrr - a.nrr;
    });

    await prisma.$transaction(
      entries.map((entry, idx) =>
        prisma.pointsTableEntry.upsert({
          where: { tournamentId_teamId: { tournamentId, teamId: entry.teamId } },
          create: {
            tournamentId,
            teamId: entry.teamId,
            played: entry.played,
            won: entry.won,
            lost: entry.lost,
            tied: entry.tied,
            noResult: entry.noResult,
            points: entry.points,
            nrr: new Prisma.Decimal(entry.nrr.toFixed(4)),
            runsScored: entry.runsScored,
            oversFaced: entry.oversFaced,
            runsConceded: entry.runsConceded,
            oversBowled: entry.oversBowled,
            position: idx + 1,
          },
          update: {
            played: entry.played,
            won: entry.won,
            lost: entry.lost,
            tied: entry.tied,
            noResult: entry.noResult,
            points: entry.points,
            nrr: new Prisma.Decimal(entry.nrr.toFixed(4)),
            runsScored: entry.runsScored,
            oversFaced: entry.oversFaced,
            runsConceded: entry.runsConceded,
            oversBowled: entry.oversBowled,
            position: idx + 1,
            lastUpdated: new Date(),
          },
        })
      )
    );

    return { status: 200, body: successResponse({ teamsUpdated: entries.length }, "Points table recalculated") };
  } catch (error) {
    return { status: 500, body: errorResponse(ErrorCodes.INTERNAL_ERROR, getErrorMessage(error, "Unable to recalculate points table")) };
  }
}
