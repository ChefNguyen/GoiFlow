import "dotenv/config";
import { ContentSourceName, JlptLevel, PromptType } from "@prisma/client";
import { prisma } from "../src/server/db/client";
import { readFile } from "node:fs/promises";

type RawVocabRecord = {
  sourceRecordId?: string;
  term: string;
  reading: string;
  jlptLevel: JlptLevel;
  partOfSpeech?: string;
  meaningsVi?: string[];
  meaningsEn?: string[];
  amHanViet?: string[];
  exampleSentence?: string;
  exampleSentenceVi?: string;
  lessonGroup?: string;
  isCommon?: boolean;
  acceptedAnswers?: string[];
};

type CliOptions = {
  input: string;
  source: ContentSourceName;
  importVersion: string;
  jlpt?: JlptLevel;
  limit?: number;
  offset: number;
  batchSize: number;
  dryRun: boolean;
};

type PreparedVocabRecord = {
  sourceRecordId: string;
  term: string;
  reading: string;
  jlptLevel: JlptLevel;
  partOfSpeech?: string;
  meaningsVi: string[];
  amHanViet: string[];
  exampleSentence?: string;
  exampleSentenceVi?: string;
  lessonGroup?: string;
  isCommon: boolean;
  normalizedSearch: string;
  acceptedAnswers: Array<{ displayValue: string; normalizedValue: string }>;
};

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function parseLevel(raw: string | undefined): JlptLevel | undefined {
  if (!raw) return undefined;
  if (["N5", "N4", "N3", "N2", "N1"].includes(raw)) return raw as JlptLevel;
  throw new Error(`Invalid --jlpt value: ${raw}`);
}

function parseSource(raw: string | undefined): ContentSourceName {
  if (!raw) return ContentSourceName.JISHO_API;
  if (["INTERNAL_SEED", "JISHO_API", "KANJI_DICT_VN"].includes(raw)) {
    return raw as ContentSourceName;
  }
  throw new Error(`Invalid --source value: ${raw}`);
}

function normalizeReading(value: string): string {
  return value.toLowerCase().trim().replace(/\./g, "").replace(/\s+/g, "");
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function normalizeSearch(term: string, reading: string, meaningsVi: string[], amHanViet: string[]): string {
  return [term, reading, ...meaningsVi, ...amHanViet]
    .join(" ")
    .toLowerCase()
    .normalize("NFC")
    .trim();
}

function buildAcceptedAnswers(record: RawVocabRecord): Array<{ displayValue: string; normalizedValue: string }> {
  const explicit = Array.isArray(record.acceptedAnswers) ? record.acceptedAnswers : [];
  const base = [record.reading, ...explicit];
  const deduped = uniqueValues(base).map((displayValue) => ({
    displayValue,
    normalizedValue: normalizeReading(displayValue),
  }));

  return deduped.filter((value) => value.normalizedValue.length > 0);
}

function ensureSourceRecordId(record: RawVocabRecord, index: number): string {
  const fallback = `${record.jlptLevel}_${record.term}_${record.reading}_${index}`;
  return (record.sourceRecordId ?? fallback).trim();
}

function prepareRecord(record: RawVocabRecord, index: number): PreparedVocabRecord {
  if (!record.term?.trim()) {
    throw new Error(`Record #${index} missing term`);
  }
  if (!record.reading?.trim()) {
    throw new Error(`Record #${index} missing reading`);
  }
  if (!record.jlptLevel) {
    throw new Error(`Record #${index} missing jlptLevel`);
  }

  const meaningsVi = uniqueValues(record.meaningsVi ?? []);
  if (meaningsVi.length === 0) {
    throw new Error(`Record #${index} (${record.term}) missing meaningsVi`);
  }

  const acceptedAnswers = buildAcceptedAnswers(record);
  if (acceptedAnswers.length === 0) {
    throw new Error(`Record #${index} (${record.term}) has no valid acceptedAnswers`);
  }

  const amHanViet = uniqueValues(record.amHanViet ?? []);
  const term = record.term.trim();
  const reading = record.reading.trim();

  return {
    sourceRecordId: ensureSourceRecordId(record, index),
    term,
    reading,
    jlptLevel: record.jlptLevel,
    partOfSpeech: record.partOfSpeech?.trim() || undefined,
    meaningsVi,
    amHanViet,
    exampleSentence: record.exampleSentence?.trim() || undefined,
    exampleSentenceVi: record.exampleSentenceVi?.trim() || undefined,
    lessonGroup: record.lessonGroup?.trim() || undefined,
    isCommon: Boolean(record.isCommon),
    normalizedSearch: normalizeSearch(term, reading, meaningsVi, amHanViet),
    acceptedAnswers,
  };
}

async function loadInput(path: string): Promise<RawVocabRecord[]> {
  const content = await readFile(path, "utf8");
  const parsed = JSON.parse(content) as unknown;

  if (Array.isArray(parsed)) {
    return parsed as RawVocabRecord[];
  }

  if (parsed && typeof parsed === "object" && Array.isArray((parsed as { records?: unknown[] }).records)) {
    return (parsed as { records: RawVocabRecord[] }).records;
  }

  throw new Error("Input must be an array of vocab records or an object with a records array");
}

function parseOptions(): CliOptions {
  const input = getArgValue("--input");
  if (!input) {
    throw new Error("Missing required --input <path>");
  }

  const source = parseSource(getArgValue("--source"));
  const importVersion = getArgValue("--import-version") ?? new Date().toISOString().slice(0, 10);
  const jlpt = parseLevel(getArgValue("--jlpt"));
  const limitRaw = getArgValue("--limit");
  const offsetRaw = getArgValue("--offset");
  const batchRaw = getArgValue("--batch-size");

  const limit = limitRaw ? Number(limitRaw) : undefined;
  const offset = offsetRaw ? Number(offsetRaw) : 0;
  const batchSize = batchRaw ? Number(batchRaw) : 100;

  if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
    throw new Error("--limit must be a positive number");
  }
  if (!Number.isFinite(offset) || offset < 0) {
    throw new Error("--offset must be a non-negative number");
  }
  if (!Number.isFinite(batchSize) || batchSize <= 0) {
    throw new Error("--batch-size must be a positive number");
  }

  return {
    input,
    source,
    importVersion,
    jlpt,
    limit,
    offset,
    batchSize,
    dryRun: hasFlag("--dry-run"),
  };
}

async function persistRecord(record: PreparedVocabRecord, options: CliOptions) {
  const now = new Date();

  const entry = await prisma.vocabularyEntry.upsert({
    where: {
      sourceName_sourceRecordId: {
        sourceName: options.source,
        sourceRecordId: record.sourceRecordId,
      },
    },
    update: {
      term: record.term,
      reading: record.reading,
      jlptLevel: record.jlptLevel,
      partOfSpeech: record.partOfSpeech,
      meaningsVi: record.meaningsVi,
      amHanViet: record.amHanViet,
      exampleSentence: record.exampleSentence,
      exampleSentenceVi: record.exampleSentenceVi,
      lessonGroup: record.lessonGroup,
      isCommon: record.isCommon,
      normalizedSearch: record.normalizedSearch,
      importVersion: options.importVersion,
      normalizedAt: now,
    },
    create: {
      term: record.term,
      reading: record.reading,
      jlptLevel: record.jlptLevel,
      partOfSpeech: record.partOfSpeech,
      meaningsVi: record.meaningsVi,
      amHanViet: record.amHanViet,
      exampleSentence: record.exampleSentence,
      exampleSentenceVi: record.exampleSentenceVi,
      lessonGroup: record.lessonGroup,
      isCommon: record.isCommon,
      normalizedSearch: record.normalizedSearch,
      sourceName: options.source,
      sourceRecordId: record.sourceRecordId,
      importVersion: options.importVersion,
      normalizedAt: now,
    },
  });

  for (const answer of record.acceptedAnswers) {
    await prisma.acceptedAnswer.upsert({
      where: {
        vocabularyEntryId_promptType_normalizedValue: {
          vocabularyEntryId: entry.id,
          promptType: PromptType.WORD_TO_READING,
          normalizedValue: answer.normalizedValue,
        },
      },
      update: {
        displayValue: answer.displayValue,
      },
      create: {
        vocabularyEntryId: entry.id,
        promptType: PromptType.WORD_TO_READING,
        displayValue: answer.displayValue,
        normalizedValue: answer.normalizedValue,
      },
    });
  }

  return entry;
}

async function main() {
  const options = parseOptions();
  const records = await loadInput(options.input);

  const filteredByLevel = options.jlpt
    ? records.filter((record) => record.jlptLevel === options.jlpt)
    : records;

  const sliced = filteredByLevel.slice(options.offset, options.limit ? options.offset + options.limit : undefined);

  let processed = 0;
  let imported = 0;
  let failed = 0;

  console.log(`[import-vocab] Loaded ${records.length} records`);
  console.log(`[import-vocab] Selected ${sliced.length} records after filters`);
  console.log(`[import-vocab] Mode: ${options.dryRun ? "dry-run" : "persist"}`);

  for (let start = 0; start < sliced.length; start += options.batchSize) {
    const batch = sliced.slice(start, start + options.batchSize);

    for (let index = 0; index < batch.length; index += 1) {
      const globalIndex = start + index + options.offset;
      const raw = batch[index];

      try {
        const prepared = prepareRecord(raw, globalIndex);
        processed += 1;

        if (!options.dryRun) {
          await persistRecord(prepared, options);
          imported += 1;
        }
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[import-vocab] Failed at record #${globalIndex}: ${message}`);
      }
    }

    console.log(
      `[import-vocab] Batch ${Math.floor(start / options.batchSize) + 1} done | processed=${processed} imported=${imported} failed=${failed}`,
    );
  }

  console.log(`[import-vocab] Completed | processed=${processed} imported=${imported} failed=${failed}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
