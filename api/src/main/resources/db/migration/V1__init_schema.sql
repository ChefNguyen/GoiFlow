-- =============================================================================
-- GoiFlow Flyway Schema Migration (PostgreSQL)
-- =============================================================================

-- Enums
DO $$ BEGIN
    CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "JlptLevel" AS ENUM ('N5', 'N4', 'N3', 'N2', 'N1');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ContentSourceName" AS ENUM ('INTERNAL_SEED', 'JISHO_API', 'KANJI_DICT_VN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "PromptType" AS ENUM ('KANJI_TO_READING', 'WORD_TO_READING', 'READING_TO_MEANING');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "GameMode" AS ENUM ('KANJI');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "GameSessionStatus" AS ENUM ('WAITING', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "RoundStatus" AS ENUM ('PENDING', 'ACTIVE', 'RESOLVED', 'SKIPPED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE "ParticipantRole" AS ENUM ('HOST', 'PLAYER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 1. User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT,
    "email" TEXT UNIQUE,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Account
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
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
    CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId")
);

-- 3. Session
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT PRIMARY KEY,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "expires" TIMESTAMP(3) NOT NULL
);

-- 4. OtpCode
CREATE TABLE IF NOT EXISTS "OtpCode" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Organization
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Membership
CREATE TABLE IF NOT EXISTS "Membership" (
    "id" TEXT PRIMARY KEY,
    "role" "OrganizationRole" NOT NULL DEFAULT 'MEMBER',
    "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Membership_userId_organizationId_key" UNIQUE ("userId", "organizationId")
);

-- 7. VocabularyEntry
CREATE TABLE IF NOT EXISTS "VocabularyEntry" (
    "id" TEXT PRIMARY KEY,
    "term" TEXT NOT NULL,
    "reading" TEXT NOT NULL,
    "jlptLevel" "JlptLevel" NOT NULL,
    "partOfSpeech" TEXT,
    "meaningsVi" TEXT[] DEFAULT '{}',
    "amHanViet" TEXT[] DEFAULT '{}',
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VocabularyEntry_sourceName_sourceRecordId_key" UNIQUE ("sourceName", "sourceRecordId")
);

-- 8. AcceptedAnswer
CREATE TABLE IF NOT EXISTS "AcceptedAnswer" (
    "id" TEXT PRIMARY KEY,
    "promptType" "PromptType" NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "displayValue" TEXT NOT NULL,
    "vocabularyEntryId" TEXT REFERENCES "VocabularyEntry"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcceptedAnswer_vocabularyEntryId_promptType_normalizedValue_key" UNIQUE ("vocabularyEntryId", "promptType", "normalizedValue")
);

-- 9. GameSession
CREATE TABLE IF NOT EXISTS "GameSession" (
    "id" TEXT PRIMARY KEY,
    "roomCode" TEXT NOT NULL UNIQUE,
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. GameParticipant
CREATE TABLE IF NOT EXISTS "GameParticipant" (
    "id" TEXT PRIMARY KEY,
    "gameSessionId" TEXT NOT NULL REFERENCES "GameSession"("id") ON DELETE CASCADE,
    "userId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
    "displayName" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'PLAYER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameParticipant_gameSessionId_userId_key" UNIQUE ("gameSessionId", "userId")
);

-- 11. GameRound
CREATE TABLE IF NOT EXISTS "GameRound" (
    "id" TEXT PRIMARY KEY,
    "gameSessionId" TEXT NOT NULL REFERENCES "GameSession"("id") ON DELETE CASCADE,
    "roundNumber" INTEGER NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'PENDING',
    "promptType" "PromptType" NOT NULL,
    "vocabularyEntryId" TEXT REFERENCES "VocabularyEntry"("id") ON DELETE SET NULL,
    "promptText" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameRound_gameSessionId_roundNumber_key" UNIQUE ("gameSessionId", "roundNumber")
);

-- 12. GameSubmission
CREATE TABLE IF NOT EXISTS "GameSubmission" (
    "id" TEXT PRIMARY KEY,
    "gameRoundId" TEXT NOT NULL REFERENCES "GameRound"("id") ON DELETE CASCADE,
    "participantId" TEXT NOT NULL REFERENCES "GameParticipant"("id") ON DELETE CASCADE,
    "rawAnswer" TEXT NOT NULL,
    "normalizedAnswer" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "isCorrect" BOOLEAN,
    "scoreAwarded" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameSubmission_gameRoundId_participantId_key" UNIQUE ("gameRoundId", "participantId")
);

-- 13. GameResult
CREATE TABLE IF NOT EXISTS "GameResult" (
    "id" TEXT PRIMARY KEY,
    "gameSessionId" TEXT NOT NULL REFERENCES "GameSession"("id") ON DELETE CASCADE,
    "participantId" TEXT NOT NULL REFERENCES "GameParticipant"("id") ON DELETE CASCADE,
    "rank" INTEGER,
    "totalScore" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "averageResponseMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameResult_gameSessionId_participantId_key" UNIQUE ("gameSessionId", "participantId")
);
