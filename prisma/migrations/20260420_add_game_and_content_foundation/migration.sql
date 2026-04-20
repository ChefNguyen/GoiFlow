-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "JlptLevel" AS ENUM ('N5', 'N4', 'N3', 'N2', 'N1');

-- CreateEnum
CREATE TYPE "ContentSourceName" AS ENUM ('INTERNAL_SEED');

-- CreateEnum
CREATE TYPE "PromptType" AS ENUM ('KANJI_TO_READING', 'WORD_TO_READING', 'READING_TO_MEANING');

-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('KANJI');

-- CreateEnum
CREATE TYPE "GameSessionStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('PENDING', 'ACTIVE', 'RESOLVED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('HOST', 'PLAYER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KanjiEntry" (
    "id" TEXT NOT NULL,
    "character" TEXT NOT NULL,
    "jlptLevel" "JlptLevel" NOT NULL,
    "strokes" INTEGER,
    "radicals" TEXT[],
    "meanings" TEXT[],
    "meaningsVi" TEXT[],
    "onyomi" TEXT[],
    "kunyomi" TEXT[],
    "amHanViet" TEXT[],
    "normalizedSearch" TEXT NOT NULL,
    "difficultyWeight" INTEGER NOT NULL DEFAULT 1,
    "isCommon" BOOLEAN NOT NULL DEFAULT false,
    "sourceName" "ContentSourceName" NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "importVersion" TEXT NOT NULL,
    "normalizedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KanjiEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VocabularyEntry" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "jlptLevel" "JlptLevel" NOT NULL,
    "partOfSpeech" TEXT,
    "meanings" TEXT[],
    "meaningsVi" TEXT[],
    "amHanViet" TEXT[],
    "exampleSentence" TEXT,
    "exampleSentenceVi" TEXT,
    "difficultyWeight" INTEGER NOT NULL DEFAULT 1,
    "isCommon" BOOLEAN NOT NULL DEFAULT false,
    "lessonGroup" TEXT,
    "normalizedSearch" TEXT NOT NULL,
    "sourceName" "ContentSourceName" NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "importVersion" TEXT NOT NULL,
    "normalizedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VocabularyEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcceptedAnswer" (
    "id" TEXT NOT NULL,
    "promptType" "PromptType" NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "displayValue" TEXT NOT NULL,
    "kanjiEntryId" TEXT,
    "vocabularyEntryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcceptedAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSession" (
    "id" TEXT NOT NULL,
    "roomCode" TEXT NOT NULL,
    "gameMode" "GameMode" NOT NULL DEFAULT 'KANJI',
    "status" "GameSessionStatus" NOT NULL DEFAULT 'WAITING',
    "hostParticipantId" TEXT,
    "jlptLevel" "JlptLevel" NOT NULL,
    "timePerPromptSeconds" INTEGER NOT NULL,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "maxRounds" INTEGER NOT NULL DEFAULT 10,
    "currentRoundNumber" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameParticipant" (
    "id" TEXT NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "userId" TEXT,
    "displayName" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'PLAYER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRound" (
    "id" TEXT NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'PENDING',
    "promptType" "PromptType" NOT NULL,
    "kanjiEntryId" TEXT,
    "vocabularyEntryId" TEXT,
    "promptText" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSubmission" (
    "id" TEXT NOT NULL,
    "gameRoundId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "rawAnswer" TEXT NOT NULL,
    "normalizedAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "scoreAwarded" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameResult" (
    "id" TEXT NOT NULL,
    "gameSessionId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "rank" INTEGER,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "averageResponseMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KanjiEntry_character_key" ON "KanjiEntry"("character");

-- CreateIndex
CREATE INDEX "KanjiEntry_jlptLevel_idx" ON "KanjiEntry"("jlptLevel");

-- CreateIndex
CREATE INDEX "KanjiEntry_normalizedSearch_idx" ON "KanjiEntry"("normalizedSearch");

-- CreateIndex
CREATE UNIQUE INDEX "KanjiEntry_sourceName_sourceRecordId_key" ON "KanjiEntry"("sourceName", "sourceRecordId");

-- CreateIndex
CREATE INDEX "VocabularyEntry_jlptLevel_idx" ON "VocabularyEntry"("jlptLevel");

-- CreateIndex
CREATE INDEX "VocabularyEntry_term_reading_idx" ON "VocabularyEntry"("term", "reading");

-- CreateIndex
CREATE INDEX "VocabularyEntry_normalizedSearch_idx" ON "VocabularyEntry"("normalizedSearch");

-- CreateIndex
CREATE UNIQUE INDEX "VocabularyEntry_sourceName_sourceRecordId_key" ON "VocabularyEntry"("sourceName", "sourceRecordId");

-- CreateIndex
CREATE INDEX "AcceptedAnswer_promptType_normalizedValue_idx" ON "AcceptedAnswer"("promptType", "normalizedValue");

-- CreateIndex
CREATE INDEX "AcceptedAnswer_kanjiEntryId_idx" ON "AcceptedAnswer"("kanjiEntryId");

-- CreateIndex
CREATE INDEX "AcceptedAnswer_vocabularyEntryId_idx" ON "AcceptedAnswer"("vocabularyEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSession_roomCode_key" ON "GameSession"("roomCode");

-- CreateIndex
CREATE INDEX "GameSession_status_idx" ON "GameSession"("status");

-- CreateIndex
CREATE INDEX "GameParticipant_gameSessionId_idx" ON "GameParticipant"("gameSessionId");

-- CreateIndex
CREATE INDEX "GameParticipant_userId_idx" ON "GameParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GameParticipant_gameSessionId_userId_key" ON "GameParticipant"("gameSessionId", "userId");

-- CreateIndex
CREATE INDEX "GameRound_gameSessionId_status_idx" ON "GameRound"("gameSessionId", "status");

-- CreateIndex
CREATE INDEX "GameRound_kanjiEntryId_idx" ON "GameRound"("kanjiEntryId");

-- CreateIndex
CREATE INDEX "GameRound_vocabularyEntryId_idx" ON "GameRound"("vocabularyEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "GameRound_gameSessionId_roundNumber_key" ON "GameRound"("gameSessionId", "roundNumber");

-- CreateIndex
CREATE INDEX "GameSubmission_participantId_idx" ON "GameSubmission"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "GameSubmission_gameRoundId_participantId_key" ON "GameSubmission"("gameRoundId", "participantId");

-- CreateIndex
CREATE INDEX "GameResult_participantId_idx" ON "GameResult"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "GameResult_gameSessionId_participantId_key" ON "GameResult"("gameSessionId", "participantId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptedAnswer" ADD CONSTRAINT "AcceptedAnswer_kanjiEntryId_fkey" FOREIGN KEY ("kanjiEntryId") REFERENCES "KanjiEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcceptedAnswer" ADD CONSTRAINT "AcceptedAnswer_vocabularyEntryId_fkey" FOREIGN KEY ("vocabularyEntryId") REFERENCES "VocabularyEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_kanjiEntryId_fkey" FOREIGN KEY ("kanjiEntryId") REFERENCES "KanjiEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_vocabularyEntryId_fkey" FOREIGN KEY ("vocabularyEntryId") REFERENCES "VocabularyEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSubmission" ADD CONSTRAINT "GameSubmission_gameRoundId_fkey" FOREIGN KEY ("gameRoundId") REFERENCES "GameRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSubmission" ADD CONSTRAINT "GameSubmission_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "GameParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameResult" ADD CONSTRAINT "GameResult_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "GameParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

