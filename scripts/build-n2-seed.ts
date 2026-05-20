import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";

type CsvSeedRow = {
  expression?: string;
  reading?: string;
  meaning?: string;
  tags?: string;
  guid?: string;
};

type N2SeedRecord = {
  sourceRecordId: string;
  term: string;
  reading: string;
  jlptLevel: "N2";
  meaningsEn: string[];
  meaningsVi: string[];
  amHanViet: string[];
  acceptedAnswers: string[];
  lessonGroup: "n2-csv";
  isCommon: true;
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function normalize(value: string | undefined): string {
  if (!value) return "";

  return value
    .normalize("NFC")
    .replace(/[()（）]/g, "")
    .replace(/[～〜]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldSkipExpression(expression: string): boolean {
  return expression.includes("～")
    || expression.includes("〜")
    || expression.startsWith("~")
    || expression.startsWith("-");
}

function parseCsv(content: string): CsvSeedRow[] {
  const lines = content
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) return [];

  const headers = splitCsvLine(lines[0]).map((header) => header.toLowerCase());
  const rows: CsvSeedRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const row: Record<string, string> = {};

    for (let j = 0; j < headers.length; j += 1) {
      row[headers[j]] = cells[j] ?? "";
    }

    rows.push({
      expression: row.expression,
      reading: row.reading,
      meaning: row.meaning,
      tags: row.tags,
      guid: row.guid,
    });
  }

  return rows;
}

function toSourceRecordId(guid: string | undefined, term: string, reading: string, index: number): string {
  const base = guid?.trim() || `${index}_${term}_${reading}`;
  const sanitized = base
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");

  return `n2csv_${sanitized || index}`;
}

function pickPrimaryVariant(value: string): string {
  return value.split(";")[0].trim();
}

function buildAcceptedAnswers(reading: string): string[] {
  return reading
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function toRecord(row: CsvSeedRow, index: number): N2SeedRecord | undefined {
  const rawTerm = normalize(row.expression);
  const rawReading = normalize(row.reading);

  if (!rawTerm || !rawReading) return undefined;
  if (shouldSkipExpression(row.expression ?? "")) return undefined;

  const term = pickPrimaryVariant(rawTerm);
  const reading = pickPrimaryVariant(rawReading);
  if (!term || !reading) return undefined;

  const meaning = normalize(row.meaning);
  const acceptedAnswers = buildAcceptedAnswers(rawReading);

  return {
    sourceRecordId: toSourceRecordId(row.guid, term, reading, index),
    term,
    reading,
    jlptLevel: "N2",
    meaningsEn: meaning ? [meaning] : [],
    meaningsVi: [],
    amHanViet: [],
    acceptedAnswers: acceptedAnswers.length > 0 ? acceptedAnswers : [reading],
    lessonGroup: "n2-csv",
    isCommon: true,
  };
}

async function main() {
  const input = process.argv[2] ?? "scripts/n2.csv";
  const output = process.argv[3] ?? "scripts/data/vocab-n2-seed.json";

  const content = await readFile(input, "utf8");
  const rows = parseCsv(content);
  const records = rows
    .map((row, index) => toRecord(row, index))
    .filter((record): record is N2SeedRecord => Boolean(record));

  await writeFile(output, JSON.stringify(records, null, 2), "utf8");

  console.log(`[build-n2-seed] Input rows: ${rows.length}`);
  console.log(`[build-n2-seed] Seed records: ${records.length}`);
  console.log(`[build-n2-seed] Output: ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
