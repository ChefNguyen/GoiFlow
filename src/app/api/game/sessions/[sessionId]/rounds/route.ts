import { NextRequest, NextResponse } from "next/server";
import { JlptLevel } from "@prisma/client";
import { selectAndCreateNextRound, normalizeAnswer, checkAnswer } from "@/server/services/content-selection-service";
import { activateRound, resolveRound, submitAnswer, scoreSubmission, findActiveRound } from "@/server/repositories/game-round-repository";
import { findGameSessionById } from "@/server/repositories/game-session-repository";
import { prisma } from "@/server/db/client";

// POST /api/game/sessions/[sessionId]/rounds — create next round
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await findGameSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const nextRoundNumber = session.currentRoundNumber + 1;
    if (nextRoundNumber > session.maxRounds) {
      return NextResponse.json(
        { status: "FINISHED", message: "All rounds have been played" },
        { status: 200 }
      );
    }

    const round = await selectAndCreateNextRound({
      gameSessionId: sessionId,
      roundNumber: nextRoundNumber,
      jlptLevel: session.jlptLevel as JlptLevel,
    });

    const activated = await activateRound(round.id);

    // Update current round tracker
    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { currentRoundNumber: nextRoundNumber }
    });

    return NextResponse.json({
      roundId: activated.id,
      roundNumber: activated.roundNumber,
      promptText: activated.promptText,
      promptType: activated.promptType,
      startedAt: activated.startedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/game/sessions/[sessionId]/rounds — get current active round
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const round = await findActiveRound(sessionId);
    if (!round) {
      return NextResponse.json({ activeRound: null }, { status: 200 });
    }

    return NextResponse.json({
      roundId: round.id,
      roundNumber: round.roundNumber,
      promptText: round.promptText,
      promptType: round.promptType,
      startedAt: round.startedAt,
      submissions: round.submissions.map((s) => ({
        participantId: s.participantId,
        submittedAt: s.submittedAt,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
