import { readFile } from "node:fs/promises";

async function main() {
  const content = await readFile("scripts/data/vocab-n2-seed.json", "utf8");
  const records = JSON.parse(content) as any[];
  console.log("Total records in seed file:", records.length);
  
  const idMap = new Map<string, number>();
  const duplicates: any[] = [];
  
  records.forEach((r, index) => {
    if (!r.sourceRecordId) {
      console.log(`Record at index ${index} has no sourceRecordId:`, r);
      return;
    }
    if (idMap.has(r.sourceRecordId)) {
      duplicates.push({
        id: r.sourceRecordId,
        term: r.term,
        firstIndex: idMap.get(r.sourceRecordId),
        secondIndex: index
      });
    } else {
      idMap.set(r.sourceRecordId, index);
    }
  });
  
  console.log("Duplicate sourceRecordIds found:", duplicates);
}
main();