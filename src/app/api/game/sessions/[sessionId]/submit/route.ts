import { NextRequest, NextResponse } from "next/server";
import { normalizeAnswer, checkAnswer } from "@/server/services/content-selection-service";
import {
  findActiveRound,
  submitAnswer,
  scoreSubmission,
  resolveRound,
} from "@/server/repositories/game-round-repository";
import { prisma } from "@/server/db/client";

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

    // Collect accepted answers from kanjiEntry or vocabularyEntry
    const acceptedValues = [
      ...(activeRound.kanjiEntry?.acceptedAnswers ?? []),
      ...(activeRound.vocabularyEntry?.acceptedAnswers ?? []),
    ]
      .filter((a) => a.promptType === activeRound.promptType)
      .map((a) => a.normalizedValue);

    const isCorrect = checkAnswer(normalized, acceptedValues);
    const scoreAwarded = isCorrect
      ? Math.max(100 - activeRound.submissions.length * 10, 10) // basic scoring: first correct scores higher
      : 0;

    const submission = await submitAnswer({
      gameRoundId: activeRound.id,
      participantId: String(participantId),
      rawAnswer: String(rawAnswer),
      normalizedAnswer: normalized,
    });

    await scoreSubmission(submission.id, isCorrect, scoreAwarded);

    // Auto-resolve round if correct OR 3rd wrong attempt
    const participantSubmissions = activeRound.submissions.filter(s => s.participantId === participantId).length + 1;
    const shouldAdvance = isCorrect || participantSubmissions >= 3;

    if (shouldAdvance) {
      await resolveRound(activeRound.id);
    }

    const details = activeRound.kanjiEntry ? {
      meaningsVi: activeRound.kanjiEntry.meaningsVi,
      amHanViet: activeRound.kanjiEntry.amHanViet,
      onyomi: activeRound.kanjiEntry.onyomi,
      kunyomi: activeRound.kanjiEntry.kunyomi,
    } : undefined;

    return NextResponse.json({
      submissionId: submission.id,
      isCorrect,
      scoreAwarded,
      normalizedAnswer: normalized,
      shouldAdvance,
      details,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
