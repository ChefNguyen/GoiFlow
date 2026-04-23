import { prisma } from "@/server/db/client";
import { JlptLevel, Prisma } from "@prisma/client";

export async function getKanjiByLevel(
  jlptLevel: JlptLevel,
  options: { take?: number; skip?: number } = {}
) {
  return prisma.kanjiEntry.findMany({
    where: { jlptLevel },
    take: options.take ?? 20,
    skip: options.skip ?? 0,
    include: { acceptedAnswers: true },
    orderBy: { difficultyWeight: "asc" },
  });
}

export async function getKanjiById(id: string) {
  return prisma.kanjiEntry.findUnique({
    where: { id },
    include: { acceptedAnswers: true },
  });
}

export async function getRandomKanjiByLevel(
  jlptLevel: JlptLevel,
  count: number,
  options: { excludeIds?: string[] } = {}
) {
  const where: Prisma.KanjiEntryWhereInput = {
    jlptLevel,
    ...(options.excludeIds && options.excludeIds.length > 0
      ? { id: { notIn: options.excludeIds } }
      : {}),
  };

  const availableCount = await prisma.kanjiEntry.count({ where });

  if (availableCount === 0 || count <= 0) {
    return [];
  }

  const take = Math.min(count, availableCount);
  const maxSkip = Math.max(availableCount - take, 0);
  const skip = maxSkip === 0 ? 0 : Math.floor(Math.random() * (maxSkip + 1));

  return prisma.kanjiEntry.findMany({
    where,
    include: { acceptedAnswers: true },
    orderBy: { id: "asc" },
    skip,
    take,
  });
}

export async function listKanjiIdsUsedInSession(gameSessionId: string) {
  const rounds = await prisma.gameRound.findMany({
    where: {
      gameSessionId,
      kanjiEntryId: { not: null },
    },
    select: {
      kanjiEntryId: true,
    },
  });

  return rounds
    .map((round) => round.kanjiEntryId)
    .filter((kanjiEntryId): kanjiEntryId is string => Boolean(kanjiEntryId));
}

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

export async function countKanjiByLevel(jlptLevel: JlptLevel) {
  return prisma.kanjiEntry.count({ where: { jlptLevel } });
}

export async function countVocabularyByLevel(jlptLevel: JlptLevel) {
  return prisma.vocabularyEntry.count({ where: { jlptLevel } });
}
