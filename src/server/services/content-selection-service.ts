import { JlptLevel, PromptType } from "@prisma/client";
import {
  getRandomVocabularyByLevel,
  countVocabularyByLevel,
  listVocabularyIdsUsedInSession,
} from "@/server/repositories/content-repository";
import { createGameRound } from "@/server/repositories/game-round-repository";

export type RoundContentInput = {
  gameSessionId: string;
  roundNumber: number;
  jlptLevel: JlptLevel;
  promptType?: PromptType;
};

export async function selectAndCreateNextRound(input: RoundContentInput) {
  const vocabularyCount = await countVocabularyByLevel(input.jlptLevel);
  if (vocabularyCount === 0) {
    throw new Error(
      `No content found for JLPT level ${input.jlptLevel}. Run import or seed scripts first.`
    );
  }

  const usedVocabularyIds = await listVocabularyIdsUsedInSession(input.gameSessionId);

  let [vocabulary] = await getRandomVocabularyByLevel(input.jlptLevel, 1, {
    excludeIds: usedVocabularyIds,
  });

  if (!vocabulary) {
    [vocabulary] = await getRandomVocabularyByLevel(input.jlptLevel, 1);
  }

  if (!vocabulary) {
    throw new Error("Failed to pick vocabulary content for round");
  }

  return createGameRound({
    gameSessionId: input.gameSessionId,
    roundNumber: input.roundNumber,
    promptType: PromptType.WORD_TO_READING,
    promptText: vocabulary.term,
    vocabularyEntryId: vocabulary.id,
  });
}

export function isHiraganaOnly(value: string): boolean {
  const normalized = value.trim();
  if (!normalized) {
    return false;
  }

  return /^[ぁ-ゖーゝゞ・\s]+$/u.test(normalized);
}

export function normalizeAnswer(raw: string): string {
  return raw.trim();
}

export function checkAnswer(
  normalizedAnswer: string,
  acceptedNormalizedValues: string[]
): boolean {
  return acceptedNormalizedValues.some((value) => value === normalizedAnswer);
}

/**
 * Check whether a normalized answer matches any accepted answer for a round.
 */
