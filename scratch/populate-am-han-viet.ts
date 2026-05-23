import "dotenv/config";
import { prisma } from "../src/server/db/client";
import { readFile } from "node:fs/promises";

// Copying the enrichFromKanjiDict logic from import-vocab.ts
function getAmHanViet(term: string, kanjiMap: Map<string, string>): string[] {
  const chars = [...term]; // Unicode-aware split
  const parts: string[] = [];

  for (const char of chars) {
    const codePoint = char.codePointAt(0) ?? 0;
    const isCJK = (codePoint >= 0x4e00 && codePoint <= 0x9fff)
      || (codePoint >= 0x3400 && codePoint <= 0x4dbf)  // Extension A
      || (codePoint >= 0x20000 && codePoint <= 0x2a6df); // Extension B
    if (!isCJK) continue;

    const reading = kanjiMap.get(char);
    if (reading) {
      parts.push(reading);
    }
  }

  if (parts.length === 0) return [];
  return [parts.join(" ")];
}

async function loadKanjiDict(path: string): Promise<Map<string, string>> {
  const content = await readFile(path, "utf8");
  const entries = JSON.parse(content) as [string, string, string, string, string[], Record<string, string>][];
  const map = new Map<string, string>();
  for (const entry of entries) {
    const kanji = entry[0];
    const readings = entry[1]?.trim();
    if (!kanji || !readings) continue;
    const primary = readings.split(/\s+/)[0];
    if (primary) {
      map.set(kanji, primary.charAt(0).toUpperCase() + primary.slice(1));
    }
  }
  return map;
}

async function main() {
  try {
    const kanjiMap = await loadKanjiDict("scripts/data/kanji-vn-source.json");
    console.log(`Loaded ${kanjiMap.size} kanji mappings.`);

    const entries = await prisma.vocabularyEntry.findMany({
      select: {
        id: true,
        term: true,
        reading: true,
        amHanViet: true,
      }
    });

    console.log(`Processing ${entries.length} database entries...`);

    let updatedCount = 0;
    for (const entry of entries) {
      const calculated = getAmHanViet(entry.term, kanjiMap);
      
      // If calculated amHanViet is different from existing, update it
      const currentStr = entry.amHanViet.join(" ");
      const calculatedStr = calculated.join(" ");
      
      if (calculatedStr && currentStr !== calculatedStr) {
        await prisma.vocabularyEntry.update({
          where: { id: entry.id },
          data: { amHanViet: calculated },
        });
        updatedCount++;
      }
    }

    console.log(`Successfully updated amHanViet for ${updatedCount} entries.`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
