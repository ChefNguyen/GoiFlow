import { prisma } from "@/server/db/client";
import {
  listRoundsForSession,
  scoreSubmission,
} from "@/server/repositories/game-round-repository";
import { finishGameSession } from "@/server/repositories/game-session-repository";

export type ParticipantResult = {
  participantId: string;
  displayName: string;
  totalScore: number;
  correctCount: number;
  rank: number;
  averageResponseMs?: number;
};

export async function computeAndPersistResults(
  gameSessionId: string
): Promise<ParticipantResult[]> {
  const rounds = await listRoundsForSession(gameSessionId);

  // Aggregate scores per participant
  const scoreMap = new Map<
    string,
    { totalScore: number; correctCount: number; displayName: string }
  >();

  for (const round of rounds) {
    for (const submission of round.submissions) {
      const existing = scoreMap.get(submission.participantId) ?? {
        totalScore: 0,
        correctCount: 0,
        displayName: "",
      };
      scoreMap.set(submission.participantId, {
        totalScore: existing.totalScore + (submission.scoreAwarded ?? 0),
        correctCount:
          existing.correctCount + (submission.isCorrect ? 1 : 0),
        displayName: existing.displayName,
      });
    }
  }

  // Fetch participant display names
  const participantIds = Array.from(scoreMap.keys());
  const participants = await prisma.gameParticipant.findMany({
    where: { id: { in: participantIds } },
    select: { id: true, displayName: true },
  });
  for (const p of participants) {
    const entry = scoreMap.get(p.id);
    if (entry) entry.displayName = p.displayName;
  }

  // Sort by totalScore descending and assign ranks
  const sorted = Array.from(scoreMap.entries()).sort(
    (a, b) => b[1].totalScore - a[1].totalScore
  );

  const results: ParticipantResult[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const [participantId, data] = sorted[i];
    const rank = i + 1;

    await prisma.gameResult.upsert({
      where: {
        gameSessionId_participantId: { gameSessionId, participantId },
      },
      create: {
        gameSessionId,
        participantId,
        rank,
        totalScore: data.totalScore,
        correctCount: data.correctCount,
      },
      update: {
        rank,
        totalScore: data.totalScore,
        correctCount: data.correctCount,
      },
    });

    results.push({
      participantId,
      displayName: data.displayName,
      totalScore: data.totalScore,
      correctCount: data.correctCount,
      rank,
    });
  }

  await finishGameSession(gameSessionId);

  return results;
}

export async function getResultsForSession(gameSessionId: string) {
  return prisma.gameResult.findMany({
    where: { gameSessionId },
    include: { participant: true },
    orderBy: { rank: "asc" },
  });
}
