-- Allow saving multiple attempts per participant per round for full input history
ALTER TABLE "GameSubmission" DROP CONSTRAINT IF EXISTS "GameSubmission_gameRoundId_participantId_key";
ALTER TABLE "GameSubmission" ADD CONSTRAINT "GameSubmission_gameRoundId_participantId_attemptCount_key" UNIQUE ("gameRoundId", "participantId", "attemptCount");
