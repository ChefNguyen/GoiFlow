import "dotenv/config";
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  try {
    const vocabEntries = await prisma.vocabularyEntry.findMany({
      where: { sourceName: "JISHO_API" },
      include: { acceptedAnswers: true },
    });

    console.log(`\n✅ Found ${vocabEntries.length} vocabulary entries from JISHO_API\n`);

    for (const entry of vocabEntries) {
      console.log(`📚 ${entry.term} (${entry.reading})`);
      console.log(`   JLPT: ${entry.jlptLevel}, Source ID: ${entry.sourceRecordId}`);
      console.log(`   Meanings: ${entry.meaningsVi}`);
      console.log(`   Am Hán Việt: ${entry.amHanViet || "(none)"}`);
      console.log(`   Accepted Answers: ${entry.acceptedAnswers.length}`);
      for (const ans of entry.acceptedAnswers) {
        console.log(`     - [${ans.promptType}] "${ans.displayValue}" → "${ans.normalizedValue}"`);
      }
      console.log();
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
