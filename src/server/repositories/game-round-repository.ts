import { prisma } from "@/server/db/client";
import { PromptType, RoundStatus } from "@prisma/client";

export async function createGameRound(input: {
  gameSessionId: string;
  roundNumber: number;
  promptType: PromptType;
  promptText: string;
  kanjiEntryId?: string;
  vocabularyEntryId?: string;
}) {
  return prisma.gameRound.create({
    data: {
      gameSessionId: input.gameSessionId,
      roundNumber: input.roundNumber,
      promptType: input.promptType,
      promptText: input.promptText,
      kanjiEntryId: input.kanjiEntryId ?? null,
      vocabularyEntryId: input.vocabularyEntryId ?? null,
      status: RoundStatus.PENDING,
    },
    include: {
      kanjiEntry: { include: { acceptedAnswers: true } },
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
      kanjiEntry: { include: { acceptedAnswers: true } },
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
      kanjiEntry: { include: { acceptedAnswers: true } },
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
}) {
  return prisma.gameSubmission.create({
    data: {
      gameRoundId: input.gameRoundId,
      participantId: input.participantId,
      rawAnswer: input.rawAnswer,
      normalizedAnswer: input.normalizedAnswer,
      // isCorrect is nullable — will be resolved when round resolves
    },
  });
}

export async function scoreSubmission(
  submissionId: string,
  isCorrect: boolean,
  scoreAwarded: number
) {
  return prisma.gameSubmission.update({
    where: { id: submissionId },
    data: { isCorrect, scoreAwarded },
  });
}

export async function listRoundsForSession(gameSessionId: string) {
  return prisma.gameRound.findMany({
    where: { gameSessionId },
    orderBy: { roundNumber: "asc" },
    include: { submissions: true },
  });
}
