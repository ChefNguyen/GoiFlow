import { prisma } from "@/server/db/client";
import { listRoundsForSession } from "@/server/repositories/game-round-repository";
import { finishGameSession } from "@/server/repositories/game-session-repository";

export type ParticipantResult = {
  participantId: string;
  displayName: string;
  totalScore: number;
  correctCount: number;
  rank: number;
  averageResponseMs?: number;
};

async function buildParticipantResults(gameSessionId: string): Promise<ParticipantResult[]> {
  const rounds = await listRoundsForSession(gameSessionId);

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

  const participantIds = Array.from(scoreMap.keys());
  const participants = await prisma.gameParticipant.findMany({
    where: { id: { in: participantIds } },
    select: { id: true, displayName: true },
  });

  for (const participant of participants) {
    const entry = scoreMap.get(participant.id);
    if (entry) {
      entry.displayName = participant.displayName;
    }
  }

  return Array.from(scoreMap.entries())
    .sort((a, b) => b[1].totalScore - a[1].totalScore)
    .map(([participantId, data], index) => ({
      participantId,
      displayName: data.displayName,
      totalScore: data.totalScore,
      correctCount: data.correctCount,
      rank: index + 1,
    }));
}

export async function getLiveStandings(gameSessionId: string): Promise<ParticipantResult[]> {
  return buildParticipantResults(gameSessionId);
}

export async function computeAndPersistResults(
  gameSessionId: string
): Promise<ParticipantResult[]> {
  const results = await buildParticipantResults(gameSessionId);

  for (const result of results) {
    await prisma.gameResult.upsert({
      where: {
        gameSessionId_participantId: {
          gameSessionId,
          participantId: result.participantId,
        },
      },
      create: {
        gameSessionId,
        participantId: result.participantId,
        rank: result.rank,
        totalScore: result.totalScore,
        correctCount: result.correctCount,
      },
      update: {
        rank: result.rank,
        totalScore: result.totalScore,
        correctCount: result.correctCount,
      },
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
