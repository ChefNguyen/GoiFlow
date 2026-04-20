import { prisma } from "@/server/db/client";
import { JlptLevel } from "@prisma/client";

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
  count: number
) {
  // Fetch a larger pool then sample — Prisma does not support ORDER BY RANDOM directly
  const total = await prisma.kanjiEntry.count({ where: { jlptLevel } });
  const skip = Math.max(0, Math.floor(Math.random() * (total - count)));

  return prisma.kanjiEntry.findMany({
    where: { jlptLevel },
    take: count,
    skip,
    include: { acceptedAnswers: true },
  });
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
