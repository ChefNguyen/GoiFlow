import { NextRequest, NextResponse } from "next/server";
import { getSessionState } from "@/server/services/game-session-service";
import { getLiveStandings } from "@/server/services/game-results-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const [session, standings] = await Promise.all([
      getSessionState(sessionId),
      getLiveStandings(sessionId),
    ]);

    return NextResponse.json({
      id: session.id,
      roomCode: session.roomCode,
      gameMode: session.gameMode,
      status: session.status,
      jlptLevel: session.jlptLevel,
      timePerPromptSeconds: session.timePerPromptSeconds,
      maxRounds: session.maxRounds,
      currentRoundNumber: session.currentRoundNumber,
      participants: session.participants.map((p) => ({
        id: p.id,
        displayName: p.displayName,
        role: p.role,
      })),
      standings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status = message === "Session not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
