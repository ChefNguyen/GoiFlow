import { ContentSourceName, JlptLevel, PromptType } from "@prisma/client";
import { prisma } from "../src/server/db/client";

const n5Kanji = [
  {
    character: "一",
    meaningsVi: ["Một", "Nhất"],
    amHanViet: ["Nhất"],
    onyomi: ["いち", "いつ"],
    kunyomi: ["ひと", "ひと.つ"],
    acceptedReadings: ["いち", "いつ", "ひと", "ひとつ"],
  },
  {
    character: "二",
    meaningsVi: ["Hai", "Nhị"],
    amHanViet: ["Nhị"],
    onyomi: ["に", "じ"],
    kunyomi: ["ふた", "ふた.つ", "ふたた.び"],
    acceptedReadings: ["に", "じ", "ふた", "ふたつ"],
  },
  {
    character: "三",
    meaningsVi: ["Ba", "Tam"],
    amHanViet: ["Tam"],
    onyomi: ["さん", "ぞう"],
    kunyomi: ["み", "み.つ", "みっ.つ"],
    acceptedReadings: ["さん", "ぞう", "み", "みつ", "みっつ"],
  },
  {
    character: "日",
    meaningsVi: ["Ngày", "Mặt trời", "Nhật"],
    amHanViet: ["Nhật"],
    onyomi: ["にち", "じつ"],
    kunyomi: ["ひ", "び", "か"],
    acceptedReadings: ["にち", "じつ", "ひ", "び", "か"],
  },
  {
    character: "月",
    meaningsVi: ["Tháng", "Mặt trăng", "Nguyệt"],
    amHanViet: ["Nguyệt"],
    onyomi: ["げつ", "がつ"],
    kunyomi: ["つき"],
    acceptedReadings: ["げつ", "がつ", "つき"],
  },
  {
    character: "水",
    meaningsVi: ["Nước", "Thủy"],
    amHanViet: ["Thủy"],
    onyomi: ["すい"],
    kunyomi: ["みず"],
    acceptedReadings: ["すい", "みず"],
  },
  {
    character: "火",
    meaningsVi: ["Lửa", "Hỏa"],
    amHanViet: ["Hỏa"],
    onyomi: ["か"],
    kunyomi: ["ひ", "び", "ほ"],
    acceptedReadings: ["か", "ひ", "び", "ほ"],
  },
];

const n4Kanji = [
  {
    character: "会",
    meaningsVi: ["Gặp", "Hội"],
    amHanViet: ["Hội"],
    onyomi: ["かい", "え"],
    kunyomi: ["あ.う", "あ.わせる", "あつ.まる"],
    acceptedReadings: ["かい", "え", "あう", "あわせる", "あつまる"],
  },
  {
    character: "同",
    meaningsVi: ["Giống nhau", "Đồng"],
    amHanViet: ["Đồng"],
    onyomi: ["どう"],
    kunyomi: ["おな.じ"],
    acceptedReadings: ["どう", "おなじ"],
  },
  {
    character: "事",
    meaningsVi: ["Việc", "Sự"],
    amHanViet: ["Sự", "Sự việc"],
    onyomi: ["じ", "ず"],
    kunyomi: ["こと"],
    acceptedReadings: ["じ", "ず", "こと"],
  },
];

type SeedKanjiItem = {
  character: string;
  meaningsVi: string[];
  amHanViet: string[];
  onyomi: string[];
  kunyomi: string[];
  acceptedReadings: string[];
};

async function seedKanji(kanjiList: SeedKanjiItem[], level: JlptLevel) {
  for (const item of kanjiList) {
    const sourceRecordId = `seed_${level}_${item.character}`;
    
    const entry = await prisma.kanjiEntry.upsert({
      where: {
        sourceName_sourceRecordId: {
          sourceName: ContentSourceName.INTERNAL_SEED,
          sourceRecordId: sourceRecordId,
        },
      },
      update: {
        meaningsVi: item.meaningsVi,
        amHanViet: item.amHanViet,
        onyomi: item.onyomi,
        kunyomi: item.kunyomi,
      },
      create: {
        character: item.character,
        jlptLevel: level,
        sourceName: ContentSourceName.INTERNAL_SEED,
        sourceRecordId: sourceRecordId,
        importVersion: "1.0",
        normalizedSearch: item.character,
        normalizedAt: new Date(),
        meaningsVi: item.meaningsVi,
        amHanViet: item.amHanViet,
        onyomi: item.onyomi,
        kunyomi: item.kunyomi,
        radicals: [],
      },
    });

    console.log(`Seeded Kanji: ${entry.character} (${level})`);

    // Create accepted answers for KANJI_TO_READING
    for (const reading of item.acceptedReadings) {
      const normalizedValue = reading.toLowerCase().trim();
      
      const existingAnswer = await prisma.acceptedAnswer.findFirst({
        where: {
          kanjiEntryId: entry.id,
          promptType: PromptType.KANJI_TO_READING,
          normalizedValue: normalizedValue,
        }
      });

      if (!existingAnswer) {
        await prisma.acceptedAnswer.create({
          data: {
            kanjiEntryId: entry.id,
            promptType: PromptType.KANJI_TO_READING,
            displayValue: reading,
            normalizedValue: normalizedValue,
          }
        });
      }
    }
  }
}

async function main() {
  console.log("Starting Kanji seed...");
  
  await seedKanji(n5Kanji, JlptLevel.N5);
  await seedKanji(n4Kanji, JlptLevel.N4);

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
