import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; matchId: string }> }) {
  const { matchId } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let running = true;
      const send = (data: unknown) => {
        if (!running) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch { running = false; }
      };

      const poll = async () => {
        try {
          const match = await prisma.match.findUnique({
            where: { id: matchId },
            include: {
              homeTeam: { select: { name: true, code: true } },
              awayTeam: { select: { name: true, code: true } },
              innings: { orderBy: [{ inningsNo: "asc" }] },
            },
          });
          if (!match) { send({ error: "Match not found" }); return; }

          const latestInnings = match.innings[match.innings.length - 1];
          let recentBalls: unknown[] = [];
          let recentCommentary: unknown[] = [];
          if (latestInnings) {
            recentBalls = await prisma.ballByBall.findMany({
              where: { inningsId: latestInnings.id },
              orderBy: [{ overNo: "desc" }, { ballNo: "desc" }],
              take: 12,
            });
            recentCommentary = await prisma.commentary.findMany({
              where: { inningsId: latestInnings.id },
              orderBy: [{ createdAt: "desc" }],
              take: 10,
            });
          }

          send({
            matchId: match.id,
            status: match.status,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            innings: match.innings.map(i => ({
              inningsNo: i.inningsNo,
              battingTeamId: i.battingTeamId,
              totalRuns: i.totalRuns,
              totalWickets: i.totalWickets,
              totalOvers: i.totalOvers.toString(),
              runRate: i.runRate.toString(),
              status: i.status,
              targetScore: i.targetScore,
            })),
            recentBalls,
            recentCommentary,
            timestamp: new Date().toISOString(),
          });
        } catch { /* skip on error */ }
      };

      await poll();
      const interval = setInterval(poll, 5000);

      setTimeout(() => {
        running = false;
        clearInterval(interval);
        try { controller.close(); } catch { /* ok */ }
      }, 5 * 60 * 1000);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
