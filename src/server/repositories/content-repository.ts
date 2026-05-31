import { prisma } from "@/server/db/client";
import { JlptLevel, Prisma } from "@prisma/client";

export type VocabularyHistoryDetailsRecord = {
  id: string;
  reading: string;
  meaningsVi: string[];
  amHanViet: string[];
};

export async function getVocabularyByLevel(
  jlptLevel: JlptLevel,
  options: { take?: number; skip?: number } = {}
) {
  return prisma.vocabularyEntry.findMany({
    where: { jlptLevel },
    take: options.take ?? 20,
    skip: options.skip ?? 0,
    include: { acceptedAnswers: true },
    orderBy: { difficultyWeight: "asc" },
  });
}

export async function getRandomVocabularyByLevel(
  jlptLevel: JlptLevel,
  count: number,
  options: { excludeIds?: string[] } = {}
) {
  const where: Prisma.VocabularyEntryWhereInput = {
    jlptLevel,
    ...(options.excludeIds && options.excludeIds.length > 0
      ? { id: { notIn: options.excludeIds } }
      : {}),
  };

  const availableCount = await prisma.vocabularyEntry.count({ where });

  if (availableCount === 0 || count <= 0) {
    return [];
  }

  const take = Math.min(count, availableCount);
  const maxSkip = Math.max(availableCount - take, 0);
  const skip = maxSkip === 0 ? 0 : Math.floor(Math.random() * (maxSkip + 1));

  return prisma.vocabularyEntry.findMany({
    where,
    include: { acceptedAnswers: true },
    orderBy: { id: "asc" },
    skip,
    take,
  });
}

export async function listVocabularyIdsUsedInSession(gameSessionId: string) {
  const rounds = await prisma.gameRound.findMany({
    where: {
      gameSessionId,
      vocabularyEntryId: { not: null },
    },
    select: {
      vocabularyEntryId: true,
    },
  });

  return rounds
    .map((round) => round.vocabularyEntryId)
    .filter((vocabularyEntryId): vocabularyEntryId is string => Boolean(vocabularyEntryId));
}

export async function countVocabularyByLevel(jlptLevel: JlptLevel) {
  return prisma.vocabularyEntry.count({ where: { jlptLevel } });
}

export async function findVocabularyHistoryDetailsById(
  vocabularyEntryId: string
): Promise<VocabularyHistoryDetailsRecord | null> {
  return prisma.vocabularyEntry.findUnique({
    where: { id: vocabularyEntryId },
    select: {
      id: true,
      reading: true,
      meaningsVi: true,
      amHanViet: true,
    },
  });
}
