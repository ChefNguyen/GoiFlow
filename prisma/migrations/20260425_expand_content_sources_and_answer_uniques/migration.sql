-- Expand content source enum for pipeline lineage
ALTER TYPE "ContentSourceName" ADD VALUE IF NOT EXISTS 'JISHO_API';
ALTER TYPE "ContentSourceName" ADD VALUE IF NOT EXISTS 'KANJI_DICT_VN';

-- Deduplicate AcceptedAnswer records before adding unique constraints
WITH ranked_kanji_answers AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "kanjiEntryId", "promptType", "normalizedValue"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS row_num
  FROM "AcceptedAnswer"
  WHERE "kanjiEntryId" IS NOT NULL
), ranked_vocab_answers AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "vocabularyEntryId", "promptType", "normalizedValue"
      ORDER BY "createdAt" ASC, "id" ASC
    ) AS row_num
  FROM "AcceptedAnswer"
  WHERE "vocabularyEntryId" IS NOT NULL
)
DELETE FROM "AcceptedAnswer"
WHERE "id" IN (
  SELECT "id" FROM ranked_kanji_answers WHERE row_num > 1
  UNION ALL
  SELECT "id" FROM ranked_vocab_answers WHERE row_num > 1
);

-- Add idempotent uniqueness constraints for importer and seed scripts
CREATE UNIQUE INDEX "AcceptedAnswer_kanjiEntryId_promptType_normalizedValue_key"
ON "AcceptedAnswer"("kanjiEntryId", "promptType", "normalizedValue");

CREATE UNIQUE INDEX "AcceptedAnswer_vocabularyEntryId_promptType_normalizedValue_key"
ON "AcceptedAnswer"("vocabularyEntryId", "promptType", "normalizedValue");
