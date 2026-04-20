import { NextRequest, NextResponse } from "next/server";
import { joinRoom } from "@/server/services/game-session-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomCode, displayName, userId } = body;

    if (!roomCode || !displayName) {
      return NextResponse.json(
        { error: "roomCode and displayName are required" },
        { status: 400 }
      );
    }

    const participant = await joinRoom({
      roomCode: String(roomCode).toUpperCase(),
      displayName: String(displayName),
      userId: userId ? String(userId) : undefined,
    });

    return NextResponse.json({
      participantId: participant.id,
      displayName: participant.displayName,
      role: participant.role,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    const status =
      message === "Room not found" ? 404
      : message === "Room is not accepting new players" ? 409
      : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
