import "dotenv/config";
import { prisma } from "../src/server/db/client";
import { readFile } from "node:fs/promises";

async function main() {
  try {
    const dbEntries = await prisma.vocabularyEntry.findMany({
      select: {
        term: true,
        sourceRecordId: true,
        normalizedAt: true,
      },
      orderBy: { normalizedAt: "asc" }
    });

    const fileContent = await readFile("scripts/data/vocab-n2-seed.json", "utf8");
    const seedRecords = JSON.parse(fileContent) as any[];

    console.log(`Found ${dbEntries.length} entries in DB.`);
    
    if (dbEntries.length === 0) return;

    // Find the index of each DB entry in the seed file
    const mapped = dbEntries.map(dbEntry => {
      const idx = seedRecords.findIndex(r => r.sourceRecordId === dbEntry.sourceRecordId || r.term === dbEntry.term);
      return {
        term: dbEntry.term,
        sourceRecordId: dbEntry.sourceRecordId,
        normalizedAt: dbEntry.normalizedAt,
        seedIndex: idx
      };
    });

    // Find the min and max seedIndex
    const validMapped = mapped.filter(m => m.seedIndex !== -1);
    const indices = validMapped.map(m => m.seedIndex);
    const minIndex = Math.min(...indices);
    const maxIndex = Math.max(...indices);

    console.log(`Min index in seed file: ${minIndex}`);
    console.log(`Max index in seed file: ${maxIndex}`);
    console.log(`Unmapped entries count: ${mapped.length - validMapped.length}`);
    
    console.log("First 5 mapped entries in DB (by insertion order):", JSON.stringify(validMapped.slice(0, 5), null, 2));
    console.log("Last 5 mapped entries in DB (by insertion order):", JSON.stringify(validMapped.slice(-5), null, 2));

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
