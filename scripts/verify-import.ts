import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const db = new PrismaClient({ adapter });

  // Get the 5 most recently created entries
  const records = await db.vocabularyEntry.findMany({
    where: { jlptLevel: "N3" },
    select: { term: true, reading: true, meaningsVi: true, amHanViet: true, normalizedSearch: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log("=== LATEST 5 RECORDS ===");
  records.forEach((r, i) => {
    console.log(`\n${i + 1}. 📖 ${r.term} (${r.reading})`);
    console.log(`   🇻🇳 VI: ${r.meaningsVi.join(", ")}`);
    console.log(`   🔤 HV: ${r.amHanViet.join(", ") || "(none)"}`);
  });

  const count = await db.vocabularyEntry.count({
    where: { jlptLevel: "N3" }
  });
  console.log(`\n📊 Total N3 Vocabularies in DB: ${count}`);

  await db.$disconnect();
  await pool.end();
}

main().catch(console.error);
