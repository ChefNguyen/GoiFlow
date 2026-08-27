-- Add leftAt column to GameParticipant table to track participant active state in session
ALTER TABLE "GameParticipant" ADD COLUMN IF NOT EXISTS "leftAt" TIMESTAMP(3);
