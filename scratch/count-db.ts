import "dotenv/config";
import { prisma } from "../src/server/db/client";

async function main() {
  try {
    const total = await prisma.vocabularyEntry.count();
    console.log("Total entries in VocabularyEntry:", total);

    const countsBySource = await prisma.vocabularyEntry.groupBy({
      by: ["sourceName"],
      _count: {
        id: true,
      },
    });
    console.log("Counts by sourceName:", JSON.stringify(countsBySource, null, 2));

    const countsByLevel = await prisma.vocabularyEntry.groupBy({
      by: ["jlptLevel"],
      _count: {
        id: true,
      },
    });
    console.log("Counts by jlptLevel:", JSON.stringify(countsByLevel, null, 2));

    const latestEntries = await prisma.vocabularyEntry.findMany({
      orderBy: { normalizedAt: "desc" },
      take: 5,
      select: {
        id: true,
        term: true,
        reading: true,
        jlptLevel: true,
        sourceName: true,
        importVersion: true,
        normalizedAt: true,
      },
    });
    console.log("Latest 5 entries:", JSON.stringify(latestEntries, null, 2));

  } catch (e) {
    console.error("Error reading database:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
