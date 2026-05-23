import "dotenv/config";
import { prisma } from "../src/server/db/client";

async function main() {
  try {
    const total = await prisma.vocabularyEntry.count();
    console.log("Total entries:", total);

    // Prisma doesn't support direct array length queries well in all databases,
    // so let's fetch all records and filter in JS, or query where meaningsVi is empty if supported.
    const all = await prisma.vocabularyEntry.findMany({
      select: {
        id: true,
        term: true,
        reading: true,
        meaningsVi: true,
      }
    });

    const emptyMeanings = all.filter(x => !x.meaningsVi || x.meaningsVi.length === 0);
    console.log("Entries with empty meaningsVi:", emptyMeanings.length);
    console.log("First 10 empty meanings entries:", emptyMeanings.slice(0, 10));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
