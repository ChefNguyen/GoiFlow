import { NextRequest, NextResponse } from "next/server";
import {
  computeAndPersistResults,
  getResultsForSession,
} from "@/server/services/game-results-service";

// GET /api/game/sessions/[sessionId]/results — fetch results
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const results = await getResultsForSession(sessionId);

    return NextResponse.json(
      results.map((r) => ({
        rank: r.rank,
        participantId: r.participantId,
        displayName: r.participant.displayName,
        totalScore: r.totalScore,
        correctCount: r.correctCount,
        averageResponseMs: r.averageResponseMs,
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/game/sessions/[sessionId]/results — compute and persist final results
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const results = await computeAndPersistResults(sessionId);
    return NextResponse.json(results);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
