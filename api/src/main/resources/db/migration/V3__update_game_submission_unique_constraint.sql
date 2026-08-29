-- Allow saving multiple attempts per participant per round for full input history
ALTER TABLE "GameSubmission" DROP CONSTRAINT IF EXISTS "GameSubmission_gameRoundId_participantId_key";
DROP INDEX IF EXISTS "GameSubmission_gameRoundId_participantId_key";

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'GameSubmission_gameRoundId_participantId_attemptCount_key'
    ) THEN
        ALTER TABLE "GameSubmission" ADD CONSTRAINT "GameSubmission_gameRoundId_participantId_attemptCount_key" 
            UNIQUE ("gameRoundId", "participantId", "attemptCount");
    END IF;
END $$;
