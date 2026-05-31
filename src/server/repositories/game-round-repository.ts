import { prisma } from "@/server/db/client";
import { PromptType, RoundStatus } from "@prisma/client";

export async function createGameRound(input: {
  gameSessionId: string;
  roundNumber: number;
  promptType: PromptType;
  promptText: string;
  vocabularyEntryId?: string;
}) {
  return prisma.gameRound.create({
    data: {
      gameSessionId: input.gameSessionId,
      roundNumber: input.roundNumber,
      promptType: input.promptType,
      promptText: input.promptText,
      vocabularyEntryId: input.vocabularyEntryId ?? null,
      status: RoundStatus.PENDING,
    },
    include: {
      vocabularyEntry: { include: { acceptedAnswers: true } },
    },
  });
}

export async function activateRound(roundId: string) {
  return prisma.gameRound.update({
    where: { id: roundId },
    data: { status: RoundStatus.ACTIVE, startedAt: new Date() },
  });
}

export async function resolveRound(roundId: string) {
  return prisma.gameRound.update({
    where: { id: roundId },
    data: { status: RoundStatus.RESOLVED, resolvedAt: new Date() },
  });
}

export async function findActiveRound(gameSessionId: string) {
  return prisma.gameRound.findFirst({
    where: { gameSessionId, status: RoundStatus.ACTIVE },
    include: {
      vocabularyEntry: { include: { acceptedAnswers: true } },
      submissions: true,
    },
  });
}

export async function findRoundByNumber(
  gameSessionId: string,
  roundNumber: number
) {
  return prisma.gameRound.findUnique({
    where: { gameSessionId_roundNumber: { gameSessionId, roundNumber } },
    include: {
      vocabularyEntry: { include: { acceptedAnswers: true } },
      submissions: true,
    },
  });
}

export async function submitAnswer(input: {
  gameRoundId: string;
  participantId: string;
  rawAnswer: string;
  normalizedAnswer: string;
  isCorrect: boolean;
  scoreAwarded: number;
}) {
  return prisma.gameSubmission.upsert({
    where: {
      gameRoundId_participantId: {
        gameRoundId: input.gameRoundId,
        participantId: input.participantId,
      },
    },
    update: {
      rawAnswer: input.rawAnswer,
      normalizedAnswer: input.normalizedAnswer,
      attemptCount: { increment: 1 },
      isCorrect: input.isCorrect,
      scoreAwarded: input.scoreAwarded,
      submittedAt: new Date(),
    },
    create: {
      gameRoundId: input.gameRoundId,
      participantId: input.participantId,
      rawAnswer: input.rawAnswer,
      normalizedAnswer: input.normalizedAnswer,
      isCorrect: input.isCorrect,
      scoreAwarded: input.scoreAwarded,
    },
  });
}

export async function listRoundsForSession(gameSessionId: string) {
  return prisma.gameRound.findMany({
    where: { gameSessionId },
    orderBy: { roundNumber: "asc" },
    include: { submissions: true },
  });
}

export async function listHistoryRoundsForSession(gameSessionId: string) {
  return prisma.gameRound.findMany({
    where: {
      gameSessionId,
      submissions: { some: {} },
    },
    orderBy: { roundNumber: "desc" },
    include: {
      vocabularyEntry: true,
      submissions: {
        orderBy: { submittedAt: "desc" },
        include: { participant: true },
      },
    },
  });
}

export async function listHistoryRoundsForSessions(gameSessionIds: string[]) {
  return prisma.gameRound.findMany({
    where: {
      gameSessionId: { in: gameSessionIds },
      submissions: { some: {} },
    },
    orderBy: [{ updatedAt: "desc" }, { roundNumber: "desc" }],
    include: {
      gameSession: {
        select: {
          id: true,
          roomCode: true,
        },
      },
      vocabularyEntry: true,
      submissions: {
        orderBy: { submittedAt: "desc" },
        include: { participant: true },
      },
    },
  });
}
