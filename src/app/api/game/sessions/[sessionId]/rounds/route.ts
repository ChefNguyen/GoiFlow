import { NextRequest, NextResponse } from "next/server";
import { JlptLevel } from "@prisma/client";
import { selectAndCreateNextRound, toVocabularyHistoryDetails } from "@/server/services/content-selection-service";
import { activateRound, findActiveRound, resolveRound } from "@/server/repositories/game-round-repository";
import { findGameSessionById } from "@/server/repositories/game-session-repository";
import { prisma } from "@/server/db/client";

// POST /api/game/sessions/[sessionId]/rounds — create or skip to next round
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

    const body = await request.json().catch(() => null);
    const action = body && typeof body === "object" ? body.action : undefined;

    let skippedRoundDetails:
      | {
          promptText: string;
          vocabularyEntryId?: string | null;
          details?: {
            meaningsVi: string[];
            amHanViet: string[];
            onyomi: string[];
            kunyomi: string[];
          };
        }
      | undefined;

    if (action === "skip") {
      const activeRound = await findActiveRound(sessionId);
      if (!activeRound) {
        return NextResponse.json({ error: "No active round for this session" }, { status: 409 });
      }

      skippedRoundDetails = {
        promptText: activeRound.promptText,
        vocabularyEntryId: activeRound.vocabularyEntryId,
        details: activeRound.vocabularyEntry
          ? toVocabularyHistoryDetails(activeRound.vocabularyEntry)
          : undefined,
      };

      await resolveRound(activeRound.id);
    }

    const nextRoundNumber = session.currentRoundNumber + 1;
    if (nextRoundNumber > session.maxRounds) {
      return NextResponse.json(
        {
          status: "FINISHED",
          message: "All rounds have been played",
          skippedRoundDetails,
        },
        { status: 200 }
      );
    }

    const round = await selectAndCreateNextRound({
      gameSessionId: sessionId,
      roundNumber: nextRoundNumber,
      jlptLevel: session.jlptLevel as JlptLevel,
    });

    const activated = await activateRound(round.id);

    await prisma.gameSession.update({
      where: { id: sessionId },
      data: { currentRoundNumber: nextRoundNumber },
    });

    return NextResponse.json({
      roundId: activated.id,
      roundNumber: activated.roundNumber,
      promptText: activated.promptText,
      promptType: activated.promptType,
      startedAt: activated.startedAt,
      vocabularyEntryId: round.vocabularyEntryId,
      skippedRoundDetails,
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
    const [session, round] = await Promise.all([
      findGameSessionById(sessionId),
      findActiveRound(sessionId),
    ]);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const sessionMetadata = {
      status: session.status,
      currentRoundNumber: session.currentRoundNumber,
      maxRounds: session.maxRounds,
    };

    if (!round) {
      return NextResponse.json({ ...sessionMetadata, activeRound: null }, { status: 200 });
    }

    const activeRound = {
      roundId: round.id,
      roundNumber: round.roundNumber,
      promptText: round.promptText,
      promptType: round.promptType,
      startedAt: round.startedAt,
      vocabularyEntryId: round.vocabularyEntryId,
      submissions: round.submissions.map((s) => ({
        participantId: s.participantId,
        submittedAt: s.submittedAt,
      })),
    };

    return NextResponse.json({
      ...sessionMetadata,
      ...activeRound,
      activeRound,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
