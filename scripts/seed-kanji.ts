import { ContentSourceName, JlptLevel, PromptType } from "@prisma/client";
import { prisma } from "../src/server/db/client";

const n5Kanji = [
  {
    character: "一",
    meanings: ["One"],
    meaningsVi: ["Một", "Nhất"],
    onyomi: ["いち", "いつ"],
    kunyomi: ["ひと", "ひと.つ"],
    acceptedReadings: ["ichi", "itsu", "hito", "hitotsu", "いち", "いつ", "ひと", "ひとつ"],
  },
  {
    character: "二",
    meanings: ["Two"],
    meaningsVi: ["Hai", "Nhị"],
    onyomi: ["に", "じ"],
    kunyomi: ["ふた", "ふた.つ", "ふたた.び"],
    acceptedReadings: ["ni", "ji", "futa", "futatsu", "に", "じ", "ふた", "ふたつ"],
  },
  {
    character: "三",
    meanings: ["Three"],
    meaningsVi: ["Ba", "Tam"],
    onyomi: ["さん", "ぞう"],
    kunyomi: ["み", "み.つ", "みっ.つ"],
    acceptedReadings: ["san", "zou", "mi", "mitsu", "mittsu", "さん", "ぞう", "み", "みつ", "みっつ"],
  },
  {
    character: "日",
    meanings: ["Day", "Sun", "Japan"],
    meaningsVi: ["Ngày", "Mặt trời", "Nhật"],
    onyomi: ["にち", "じつ"],
    kunyomi: ["ひ", "び", "か"],
    acceptedReadings: ["nichi", "jitsu", "hi", "bi", "ka", "にち", "じつ", "ひ", "び", "か"],
  },
  {
    character: "月",
    meanings: ["Month", "Moon"],
    meaningsVi: ["Tháng", "Mặt trăng", "Nguyệt"],
    onyomi: ["げつ", "がつ"],
    kunyomi: ["つき"],
    acceptedReadings: ["getsu", "gatsu", "tsuki", "げつ", "がつ", "つき"],
  },
  {
    character: "水",
    meanings: ["Water"],
    meaningsVi: ["Nước", "Thủy"],
    onyomi: ["すい"],
    kunyomi: ["みず"],
    acceptedReadings: ["sui", "mizu", "すい", "みず"],
  },
  {
    character: "火",
    meanings: ["Fire"],
    meaningsVi: ["Lửa", "Hỏa"],
    onyomi: ["か"],
    kunyomi: ["ひ", "び", "ほ"],
    acceptedReadings: ["ka", "hi", "bi", "ho", "か", "ひ", "び", "ほ"],
  },
];

const n4Kanji = [
  {
    character: "会",
    meanings: ["Meeting", "Meet", "Party", "Association"],
    meaningsVi: ["Gặp", "Hội"],
    onyomi: ["かい", "え"],
    kunyomi: ["あ.う", "あ.わせる", "あつ.まる"],
    acceptedReadings: ["kai", "e", "au", "awaseru", "atsumaru", "かい", "え", "あう", "あわせる", "あつまる"],
  },
  {
    character: "同",
    meanings: ["Same", "Agree", "Equal"],
    meaningsVi: ["Giống nhau", "Đồng"],
    onyomi: ["どう"],
    kunyomi: ["おな.じ"],
    acceptedReadings: ["dou", "onaji", "どう", "おなじ"],
  },
  {
    character: "事",
    meanings: ["Matter", "Thing", "Fact", "Business", "Reason"],
    meaningsVi: ["Việc", "Sự"],
    onyomi: ["じ", "ず"],
    kunyomi: ["こと"],
    acceptedReadings: ["ji", "zu", "koto", "じ", "ず", "こと"],
  },
];

async function seedKanji(kanjiList: any[], level: JlptLevel) {
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
        meanings: item.meanings,
        meaningsVi: item.meaningsVi,
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
        meanings: item.meanings,
        meaningsVi: item.meaningsVi,
        onyomi: item.onyomi,
        kunyomi: item.kunyomi,
        radicals: [],
        amHanViet: [],
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
