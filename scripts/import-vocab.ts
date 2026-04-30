import "dotenv/config";
import { ContentSourceName, JlptLevel, PromptType } from "@prisma/client";
import JishoAPI, { JishoResult } from "unofficial-jisho-api";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "../src/server/db/client";
import { access, readFile, writeFile } from "node:fs/promises";

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

type IngestMode = "file" | "jisho";

type CliOptions = {
  input: string;
  source: ContentSourceName;
  importVersion: string;
  jlpt?: JlptLevel;
  limit?: number;
  offset: number;
  batchSize: number;
  dryRun: boolean;
  ingest: IngestMode;
  delayMs: number;
  maxRetries: number;
  retryBaseMs: number;
  progressFile?: string;
  resume: boolean;
  ai: boolean;
  kanjiDict?: string;
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

type ImportProgress = {
  input: string;
  ingest: IngestMode;
  lastCompletedIndex: number;
  updatedAt: string;
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

function parseIngestMode(raw: string | undefined): IngestMode {
  if (!raw) return "file";
  if (raw === "file" || raw === "jisho") return raw;
  throw new Error(`Invalid --ingest value: ${raw}`);
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
  const ingest = parseIngestMode(getArgValue("--ingest"));
  const delayRaw = getArgValue("--delay-ms");
  const retriesRaw = getArgValue("--max-retries");
  const retryBaseRaw = getArgValue("--retry-base-ms");
  const progressFile = getArgValue("--progress-file");

  const limit = limitRaw ? Number(limitRaw) : undefined;
  const offset = offsetRaw ? Number(offsetRaw) : 0;
  const batchSize = batchRaw ? Number(batchRaw) : 100;
  const delayMs = delayRaw ? Number(delayRaw) : 700;
  const maxRetries = retriesRaw ? Number(retriesRaw) : 4;
  const retryBaseMs = retryBaseRaw ? Number(retryBaseRaw) : 500;

  if (limit !== undefined && (!Number.isFinite(limit) || limit <= 0)) {
    throw new Error("--limit must be a positive number");
  }
  if (!Number.isFinite(offset) || offset < 0) {
    throw new Error("--offset must be a non-negative number");
  }
  if (!Number.isFinite(batchSize) || batchSize <= 0) {
    throw new Error("--batch-size must be a positive number");
  }
  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new Error("--delay-ms must be a non-negative number");
  }
  if (!Number.isFinite(maxRetries) || maxRetries < 0) {
    throw new Error("--max-retries must be a non-negative number");
  }
  if (!Number.isFinite(retryBaseMs) || retryBaseMs < 0) {
    throw new Error("--retry-base-ms must be a non-negative number");
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
    ingest,
    delayMs,
    maxRetries,
    retryBaseMs,
    progressFile: progressFile ?? (ingest === "jisho" ? "scripts/data/.import-progress.json" : undefined),
    resume: hasFlag("--resume"),
    ai: hasFlag("--ai"),
    kanjiDict: getArgValue("--kanji-dict"),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toJlptLevel(raw: string | undefined): JlptLevel | undefined {
  if (!raw) return undefined;
  const match = raw.toUpperCase().match(/N[1-5]/);
  if (!match) return undefined;
  return match[0] as JlptLevel;
}

function parseJlptFromTags(tags: string[] | undefined): JlptLevel | undefined {
  if (!tags || tags.length === 0) return undefined;
  for (const tag of tags) {
    const parsed = toJlptLevel(tag);
    if (parsed) return parsed;
  }
  return undefined;
}

function pickBestResult(data: JishoResult[], term: string, reading?: string): JishoResult | undefined {
  if (data.length === 0) return undefined;

  const exactWord = data.find((item) => item.japanese.some((jp) => jp.word === term));
  if (exactWord) return exactWord;

  if (reading) {
    const exactReading = data.find((item) => item.japanese.some((jp) => jp.reading === reading));
    if (exactReading) return exactReading;
  }

  return data[0];
}

function getBestJapanese(result: JishoResult, fallbackTerm: string, fallbackReading: string) {
  const exactWord = result.japanese.find((jp) => jp.word === fallbackTerm);
  const best = exactWord ?? result.japanese[0];
  return {
    term: best?.word ?? fallbackTerm,
    reading: best?.reading ?? fallbackReading,
  };
}

function getPartOfSpeech(result: JishoResult): string | undefined {
  const values = uniqueValues(result.senses.flatMap((sense) => sense.parts_of_speech ?? []));
  return values.length > 0 ? values.join(", ") : undefined;
}

async function withRetry<T>(
  action: () => Promise<T>,
  options: CliOptions,
  label: string,
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await action();
    } catch (error) {
      attempt += 1;
      if (attempt > options.maxRetries) {
        throw error;
      }
      // Tính toán thời gian chờ dựa trên số lần thử
      const waitMs = Math.min(options.retryBaseMs * 2 ** (attempt - 1), 8000);
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(`[import-vocab] Retry ${attempt}/${options.maxRetries} for ${label}: ${message}`);
      await sleep(waitMs);
    }
  }
}

async function loadProgress(path: string): Promise<ImportProgress | undefined> {
  try {
    await access(path);
  } catch {
    return undefined;
  }

  const content = await readFile(path, "utf8");
  const parsed = JSON.parse(content) as ImportProgress;
  if (typeof parsed?.lastCompletedIndex !== "number") return undefined;
  return parsed;
}

async function saveProgress(path: string, progress: ImportProgress) {
  await writeFile(path, JSON.stringify(progress, null, 2), "utf8");
}

/**
 * Load the KanjiDictVN bank file and build a lookup map: kanji char -> primary Sino-Vietnamese reading.
 * The bank format is an array of tuples: [kanji, "âm1 âm2 ...", "", "", [meanings], {meta}]
 * We capitalise the first reading (the most authoritative) as the canonical form.
 */
async function loadKanjiDict(path: string): Promise<Map<string, string>> {
  const content = await readFile(path, "utf8");
  const entries = JSON.parse(content) as [string, string, string, string, string[], Record<string, string>][];
  const map = new Map<string, string>();
  for (const entry of entries) {
    const kanji = entry[0];
    const readings = entry[1]?.trim();
    if (!kanji || !readings) continue;
    // Take the first space-separated reading and capitalise it
    const primary = readings.split(/\s+/)[0];
    if (primary) {
      map.set(kanji, primary.charAt(0).toUpperCase() + primary.slice(1));
    }
  }
  return map;
}

/**
 * ENRICH STAGE 2a — deterministic amHanViet from KanjiDictVN.
 * Splits term into individual characters, looks up each in the map, and joins them.
 * Characters without a mapping are skipped with a warning (never hallucinated).
 */
function enrichFromKanjiDict(
  input: RawVocabRecord,
  kanjiMap: Map<string, string>,
): RawVocabRecord {
  // If amHanViet already populated (e.g. from file ingest), keep it
  if ((input.amHanViet?.length ?? 0) > 0) return input;

  const chars = [...input.term]; // Unicode-aware split
  const parts: string[] = [];
  const missing: string[] = [];

  for (const char of chars) {
    // Only lookup CJK Unified Ideographs (U+4E00–U+9FFF and extensions)
    const codePoint = char.codePointAt(0) ?? 0;
    const isCJK = (codePoint >= 0x4e00 && codePoint <= 0x9fff)
      || (codePoint >= 0x3400 && codePoint <= 0x4dbf)  // Extension A
      || (codePoint >= 0x20000 && codePoint <= 0x2a6df); // Extension B
    if (!isCJK) continue; // Skip kana, punctuation, etc.

    const reading = kanjiMap.get(char);
    if (reading) {
      parts.push(reading);
    } else {
      missing.push(char);
    }
  }

  if (missing.length > 0) {
    console.warn(`[kanji-dict] Missing mapping for kanji [${missing.join(", ")}] in term "${input.term}" — amHanViet will be partial or empty.`);
  }

  if (parts.length === 0) return input;

  return {
    ...input,
    amHanViet: [parts.join(" ")],
  };
}

async function enrichFromJisho(
  input: RawVocabRecord,
  index: number,
  options: CliOptions,
  jisho: JishoAPI,
): Promise<RawVocabRecord> {
  const query = input.term?.trim();
  if (!query) {
    throw new Error(`Record #${index} missing term for Jisho ingest`);
  }

  const search = await withRetry(
    () => jisho.searchForPhrase(query),
    options,
    `searchForPhrase(${query})`,
  );

  const best = pickBestResult(search.data ?? [], query, input.reading);
  if (!best) {
    throw new Error(`No Jisho result for term: ${query}`);
  }

  const japanese = getBestJapanese(best, input.term, input.reading || input.term);
  const partOfSpeech = getPartOfSpeech(best);
  const meaningsEn = uniqueValues(best.senses.flatMap((sense) => sense.english_definitions ?? []));

  let jlptLevel = input.jlptLevel ?? parseJlptFromTags(best.jlpt);
  if (!jlptLevel && best.jlpt.length === 0) {
    const scrape = await withRetry(
      () => jisho.scrapeForPhrase(query),
      options,
      `scrapeForPhrase(${query})`,
    );
    jlptLevel = parseJlptFromTags(scrape.tags) ?? jlptLevel;
  }

  const meaningsVi = uniqueValues(input.meaningsVi ?? []);

  return {
    ...input,
    term: japanese.term,
    reading: japanese.reading,
    jlptLevel: jlptLevel ?? input.jlptLevel,
    partOfSpeech: input.partOfSpeech ?? partOfSpeech,
    meaningsEn,
    meaningsVi,
    amHanViet: uniqueValues(input.amHanViet ?? []),
    isCommon: input.isCommon ?? Boolean(best.is_common),
    acceptedAnswers: uniqueValues(input.acceptedAnswers ?? [japanese.reading]),
  };
}

/**
 * ENRICH STAGE 2b — Vietnamese meanings via Gemini.
 * Only fills meaningsVi. Never generates amHanViet (that is KanjiDictVN's job).
 */
async function enrichFromAI(
  input: RawVocabRecord,
  options: CliOptions,
  genAI: GoogleGenerativeAI,
): Promise<RawVocabRecord> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

  const prompt = `
You are a Japanese-Vietnamese linguistic expert.
Translate the Japanese word into natural Vietnamese meanings.

Word: ${input.term}
Reading: ${input.reading}
Part of speech: ${input.partOfSpeech ?? "unknown"}
English meanings: ${input.meaningsEn?.join(", ") || "N/A"}

Rules:
- Return only a JSON object with one field: "meaningsVi" (array of strings).
- Each meaning should be a natural Vietnamese phrase, not a literal character-by-character translation.
- Maximum 5 meanings. If you are unsure, return fewer.
- Do NOT include any explanation, markdown, or extra text — pure JSON only.

JSON response:`;

  const result = await withRetry(
    async () => {
      const res = await model.generateContent(prompt);
      const text = res.response.text();
      const jsonMatch = text.match(/{[\s\S]*}/);
      if (!jsonMatch) throw new Error("Failed to parse AI response as JSON");
      const parsed = JSON.parse(jsonMatch[0]) as { meaningsVi?: string[] };
      if (!Array.isArray(parsed.meaningsVi)) throw new Error("AI response missing meaningsVi array");
      return parsed;
    },
    options,
    `enrichFromAI(${input.term})`,
  );

  return {
    ...input,
    meaningsVi: uniqueValues([...(input.meaningsVi ?? []), ...(result.meaningsVi ?? [])]),
    // amHanViet is intentionally NOT touched here — handled by enrichFromKanjiDict only
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
  const jisho = options.ingest === "jisho" ? new JishoAPI() : undefined;

  const genAI = options.ai && process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : undefined;

  if (options.ai && !genAI) {
    console.warn("[import-vocab] AI enrichment requested but GEMINI_API_KEY is missing in .env");
  }

  // Load KanjiDictVN lookup map if --kanji-dict path is provided
  let kanjiMap: Map<string, string> | undefined;
  if (options.kanjiDict) {
    kanjiMap = await loadKanjiDict(options.kanjiDict);
    console.log(`[import-vocab] Loaded KanjiDictVN: ${kanjiMap.size} kanji mappings from ${options.kanjiDict}`);
  }

  const filteredByLevel = options.jlpt
    ? records.filter((record) => record.jlptLevel === options.jlpt)
    : records;

  let effectiveOffset = options.offset;
  if (options.resume && options.progressFile) {
    const progress = await loadProgress(options.progressFile);
    if (progress && progress.input === options.input && progress.ingest === options.ingest) {
      effectiveOffset = Math.max(effectiveOffset, progress.lastCompletedIndex + 1);
      console.log(`[import-vocab] Resume from offset ${effectiveOffset}`);
    }
  }

  const sliced = filteredByLevel.slice(
    effectiveOffset,
    options.limit ? effectiveOffset + options.limit : undefined,
  );

  let processed = 0;
  let imported = 0;
  let failed = 0;
  let jishoRecordCount = 0;

  console.log(`[import-vocab] Loaded ${records.length} records`);
  console.log(`[import-vocab] Selected ${sliced.length} records after filters`);
  console.log(`[import-vocab] Ingest mode: ${options.ingest}`);
  console.log(`[import-vocab] Mode: ${options.dryRun ? "dry-run" : "persist"}`);
  console.log(`[import-vocab] KanjiDict: ${kanjiMap ? "enabled" : "disabled (use --kanji-dict to enable)"}`);
  console.log(`[import-vocab] AI enrichment: ${genAI ? "enabled" : "disabled (use --ai and GEMINI_API_KEY)"}`);

  for (let start = 0; start < sliced.length; start += options.batchSize) {
    const batch = sliced.slice(start, start + options.batchSize);

    for (let index = 0; index < batch.length; index += 1) {
      const globalIndex = start + index + effectiveOffset;
      const raw = batch[index];

      try {
        let source = raw;

        // Stage 1: INGEST — fetch from Jisho if requested
        if (options.ingest === "jisho") {
          if (!jisho) {
            throw new Error("Jisho ingest is not initialized");
          }

          if (jishoRecordCount > 0 && options.delayMs > 0) {
            await sleep(options.delayMs);
          }

          source = await enrichFromJisho(raw, globalIndex, options, jisho);
          jishoRecordCount += 1;
        }

        // Stage 2a: ENRICH amHanViet deterministically from KanjiDictVN
        if (kanjiMap) {
          source = enrichFromKanjiDict(source, kanjiMap);
        }

        // Stage 2b: ENRICH meaningsVi via AI — only if still missing
        if (genAI && (source.meaningsVi?.length === 0)) {
          source = await enrichFromAI(source, options, genAI);
        }

        const prepared = prepareRecord(source, globalIndex);
        processed += 1;

        if (!options.dryRun) {
          await persistRecord(prepared, options);
          imported += 1;
        }
      } catch (error) {
        failed += 1;
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`[import-vocab] Failed at record #${globalIndex}: ${message}`);
      } finally {
        if (options.progressFile) {
          await saveProgress(options.progressFile, {
            input: options.input,
            ingest: options.ingest,
            lastCompletedIndex: globalIndex,
            updatedAt: new Date().toISOString(),
          });
        }
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
