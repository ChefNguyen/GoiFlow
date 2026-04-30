import { NextRequest, NextResponse } from "next/server";
import {
  normalizeAnswer,
  checkAnswer,
  isHiraganaOnly,
} from "@/server/services/content-selection-service";
import {
  findActiveRound,
  submitAnswer,
  resolveRound,
} from "@/server/repositories/game-round-repository";

// POST /api/game/sessions/[sessionId]/submit
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { participantId, rawAnswer } = body;

    if (!participantId || !rawAnswer) {
      return NextResponse.json(
        { error: "participantId and rawAnswer are required" },
        { status: 400 }
      );
    }

    const activeRound = await findActiveRound(sessionId);
    if (!activeRound) {
      return NextResponse.json(
        { error: "No active round for this session" },
        { status: 409 }
      );
    }

    const normalized = normalizeAnswer(String(rawAnswer));
    const usesHiraganaOnly = isHiraganaOnly(normalized);

    // Collect accepted answers from kanjiEntry or vocabularyEntry
    const acceptedValues = [
      ...(activeRound.kanjiEntry?.acceptedAnswers ?? []),
      ...(activeRound.vocabularyEntry?.acceptedAnswers ?? []),
    ]
      .filter((a) => a.promptType === activeRound.promptType)
      .map((a) => a.normalizedValue);

    const isCorrect = usesHiraganaOnly && checkAnswer(normalized, acceptedValues);
    const scoreAwarded = isCorrect ? 1 : 0;

    const submission = await submitAnswer({
      gameRoundId: activeRound.id,
      participantId: String(participantId),
      rawAnswer: String(rawAnswer),
      normalizedAnswer: normalized,
      isCorrect,
      scoreAwarded,
    });

    const shouldAdvance = isCorrect || submission.attemptCount >= 3;

    if (shouldAdvance) {
      await resolveRound(activeRound.id);
    }

    const details = shouldAdvance
      ? activeRound.kanjiEntry
        ? {
            meaningsVi: activeRound.kanjiEntry.meaningsVi,
            amHanViet: activeRound.kanjiEntry.amHanViet,
            onyomi: activeRound.kanjiEntry.onyomi,
            kunyomi: activeRound.kanjiEntry.kunyomi,
          }
        : activeRound.vocabularyEntry
          ? {
              meaningsVi: activeRound.vocabularyEntry.meaningsVi,
              amHanViet: activeRound.vocabularyEntry.amHanViet,
              onyomi: [activeRound.vocabularyEntry.reading],
              kunyomi: [],
            }
          : undefined
      : undefined;

    return NextResponse.json({
      submissionId: submission.id,
      isCorrect,
      scoreAwarded,
      normalizedAnswer: normalized,
      shouldAdvance,
      validationMessage: usesHiraganaOnly ? null : "Use hiragana only",
      details,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
