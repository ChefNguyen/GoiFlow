import "dotenv/config";
import { prisma } from "../src/server/db/client";

async function main() {
  try {
    const total = await prisma.vocabularyEntry.count({
      where: { jlptLevel: "N2" }
    });
    const withAmHanViet = await prisma.vocabularyEntry.count({
      where: {
        jlptLevel: "N2",
        NOT: {
          amHanViet: {
            equals: []
          }
        }
      }
    });
    console.log(`N2 entries: total=${total}, with amHanViet=${withAmHanViet}`);
    
    const check = await prisma.vocabularyEntry.findMany({
      where: {
        term: {
          in: ["弟子", "でたらめ", "手帳", "鉄橋", "手続き"]
        }
      },
      select: {
        term: true,
        meaningsVi: true,
        amHanViet: true,
        normalizedAt: true,
      }
    });
    console.log("Check entries:", JSON.stringify(check, null, 2));
  } catch (e) {
    console.error("Error reading database:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
