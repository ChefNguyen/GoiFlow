import "dotenv/config";
import { JlptLevel, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function parseJlpt(raw: string | undefined): JlptLevel {
  if (!raw) return "N3";
  if (["N5", "N4", "N3", "N2", "N1"].includes(raw)) return raw as JlptLevel;
  throw new Error(`Invalid --jlpt value: ${raw}`);
}

async function main() {
  const jlpt = parseJlpt(getArgValue("--jlpt"));

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  const records = await db.vocabularyEntry.findMany({
    where: { jlptLevel: jlpt },
    select: { term: true, reading: true, meaningsVi: true, amHanViet: true, normalizedSearch: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log(`=== LATEST 5 RECORDS (${jlpt}) ===`);
  records.forEach((r, i) => {
    console.log(`\n${i + 1}. 📖 ${r.term} (${r.reading})`);
    console.log(`   🇻🇳 VI: ${r.meaningsVi.join(", ")}`);
    console.log(`   🔤 HV: ${r.amHanViet.join(", ") || "(none)"}`);
  });

  const count = await db.vocabularyEntry.count({
    where: { jlptLevel: jlpt },
  });
  console.log(`\n📊 Total ${jlpt} Vocabularies in DB: ${count}`);

  await db.$disconnect();
  await pool.end();
}

main().catch(console.error);
