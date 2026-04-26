import { JlptLevel, PromptType } from "@prisma/client";
import {
  getRandomKanjiByLevel,
  countKanjiByLevel,
  listKanjiIdsUsedInSession,
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

/**
 * Selects a kanji entry from the DB and creates a GameRound for it.
 * Uses KANJI_TO_READING as the default prompt type for Sprint 1.
 */
export async function selectAndCreateNextRound(input: RoundContentInput) {
  const promptType = input.promptType ?? PromptType.KANJI_TO_READING;

  const kanjiCount = await countKanjiByLevel(input.jlptLevel);

  if (kanjiCount > 0) {
    const usedKanjiIds = await listKanjiIdsUsedInSession(input.gameSessionId);

    let [kanji] = await getRandomKanjiByLevel(input.jlptLevel, 1, {
      excludeIds: usedKanjiIds,
    });

    if (!kanji) {
      [kanji] = await getRandomKanjiByLevel(input.jlptLevel, 1);
    }

    if (!kanji) {
      throw new Error("Failed to pick kanji content for round");
    }

    return createGameRound({
      gameSessionId: input.gameSessionId,
      roundNumber: input.roundNumber,
      promptType,
      promptText: kanji.character,
      kanjiEntryId: kanji.id,
    });
  }

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
