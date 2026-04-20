import { NextRequest, NextResponse } from "next/server";
import { findGameSessionByCode } from "@/server/repositories/game-session-repository";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  try {
    const { roomCode } = await params;
    const session = await findGameSessionByCode(roomCode.toUpperCase());
    if (!session) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: session.id,
      roomCode: session.roomCode,
      status: session.status,
      jlptLevel: session.jlptLevel,
      gameMode: session.gameMode,
      participantCount: session.participants.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
