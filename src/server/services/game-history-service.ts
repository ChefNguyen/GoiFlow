import {
  listHistoryRoundsForSession,
  listHistoryRoundsForSessions,
} from "@/server/repositories/game-round-repository";
import { toVocabularyHistoryDetails, type VocabularyHistoryDetails } from "@/server/services/content-selection-service";

export const MAX_HISTORY_ENTRIES = 100;

export type GameHistoryEntry = {
  id: string;
  sessionId: string;
  roomCode?: string;
  roundId: string;
  roundNumber: number;
  promptText: string;
  promptType: string;
  rawAnswer: string;
  isCorrect: boolean;
  attemptCount: number;
  participantName: string;
  submittedAt: string;
  vocabularyEntryId: string | null;
  details?: VocabularyHistoryDetails;
};

export function normalizeHistorySessionIds(sessionIds: unknown): string[] {
  if (!Array.isArray(sessionIds)) return [];

  return Array.from(
    new Set(
      sessionIds
        .filter((sessionId): sessionId is string => typeof sessionId === "string")
        .map((sessionId) => sessionId.trim())
        .filter(Boolean)
    )
  );
}

export function normalizeHistoryLimit(limit: unknown): number {
  const parsedLimit = typeof limit === "number" ? limit : Number(limit);

  if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) return MAX_HISTORY_ENTRIES;

  return Math.min(Math.floor(parsedLimit), MAX_HISTORY_ENTRIES);
}

export async function getSessionHistory(gameSessionId: string): Promise<GameHistoryEntry[]> {
  const rounds = await listHistoryRoundsForSession(gameSessionId);

  return rounds.flatMap((round) =>
    round.submissions.map((submission) => ({
      id: submission.id,
      sessionId: round.gameSessionId,
      roundId: round.id,
      roundNumber: round.roundNumber,
      promptText: round.promptText,
      promptType: round.promptType,
      rawAnswer: submission.rawAnswer,
      isCorrect: Boolean(submission.isCorrect),
      attemptCount: submission.attemptCount,
      participantName: submission.participant.displayName,
      submittedAt: submission.submittedAt.toISOString(),
      vocabularyEntryId: round.vocabularyEntryId,
      details: round.vocabularyEntry ? toVocabularyHistoryDetails(round.vocabularyEntry) : undefined,
    }))
  );
}

export async function getSessionsHistory(
  gameSessionIds: string[],
  limit: number = MAX_HISTORY_ENTRIES
): Promise<GameHistoryEntry[]> {
  const normalizedSessionIds = normalizeHistorySessionIds(gameSessionIds);
  const normalizedLimit = normalizeHistoryLimit(limit);

  if (normalizedSessionIds.length === 0) return [];

  const rounds = await listHistoryRoundsForSessions(normalizedSessionIds);

  return rounds
    .flatMap((round) =>
      round.submissions.map((submission) => ({
        id: submission.id,
        sessionId: round.gameSessionId,
        roomCode: round.gameSession.roomCode,
        roundId: round.id,
        roundNumber: round.roundNumber,
        promptText: round.promptText,
        promptType: round.promptType,
        rawAnswer: submission.rawAnswer,
        isCorrect: Boolean(submission.isCorrect),
        attemptCount: submission.attemptCount,
        participantName: submission.participant.displayName,
        submittedAt: submission.submittedAt.toISOString(),
        vocabularyEntryId: round.vocabularyEntryId,
        details: round.vocabularyEntry ? toVocabularyHistoryDetails(round.vocabularyEntry) : undefined,
      }))
    )
    .sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt))
    .slice(0, normalizedLimit);
}
