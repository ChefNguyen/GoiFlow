-- Explicitly drop the old unique constraint on (gameRoundId, participantId)
ALTER TABLE "GameSubmission" DROP CONSTRAINT IF EXISTS "GameSubmission_gameRoundId_participantId_key";
DROP INDEX IF EXISTS "GameSubmission_gameRoundId_participantId_key";

-- Add the new unique constraint on (gameRoundId, participantId, attemptCount)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'GameSubmission_gameRoundId_participantId_attemptCount_key'
    ) THEN
        ALTER TABLE "GameSubmission" ADD CONSTRAINT "GameSubmission_gameRoundId_participantId_attemptCount_key" 
            UNIQUE ("gameRoundId", "participantId", "attemptCount");
    END IF;
END $$;
