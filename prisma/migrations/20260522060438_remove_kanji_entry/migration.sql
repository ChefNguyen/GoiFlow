/*
  Warnings:

  - You are about to drop the column `kanjiEntryId` on the `AcceptedAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `kanjiEntryId` on the `GameRound` table. All the data in the column will be lost.
  - You are about to drop the column `meanings` on the `VocabularyEntry` table. All the data in the column will be lost.
  - You are about to drop the `KanjiEntry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "AcceptedAnswer" DROP CONSTRAINT "AcceptedAnswer_kanjiEntryId_fkey";

-- DropForeignKey
ALTER TABLE "GameRound" DROP CONSTRAINT "GameRound_kanjiEntryId_fkey";

-- DropIndex
DROP INDEX "AcceptedAnswer_kanjiEntryId_idx";

-- DropIndex
DROP INDEX "AcceptedAnswer_kanjiEntryId_promptType_normalizedValue_key";

-- DropIndex
DROP INDEX "GameRound_kanjiEntryId_idx";

-- AlterTable
ALTER TABLE "AcceptedAnswer" DROP COLUMN "kanjiEntryId";

-- AlterTable
ALTER TABLE "GameRound" DROP COLUMN "kanjiEntryId";

-- AlterTable
ALTER TABLE "GameSubmission" ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "VocabularyEntry" DROP COLUMN "meanings";

-- DropTable
DROP TABLE "KanjiEntry";
