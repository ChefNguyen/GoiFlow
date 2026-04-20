import { NextRequest, NextResponse } from "next/server";
import { GameMode, JlptLevel } from "@prisma/client";
import { createRoom } from "@/server/services/game-session-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      gameMode = "KANJI",
      jlptLevel,
      timePerPromptSeconds = 15,
      isPrivate = false,
      maxRounds = 10,
      hostDisplayName,
      hostUserId,
    } = body;

    if (!jlptLevel || !hostDisplayName) {
      return NextResponse.json(
        { error: "jlptLevel and hostDisplayName are required" },
        { status: 400 }
      );
    }

    if (!Object.values(JlptLevel).includes(jlptLevel)) {
      return NextResponse.json(
        { error: `Invalid jlptLevel. Must be one of: ${Object.values(JlptLevel).join(", ")}` },
        { status: 400 }
      );
    }

    const session = await createRoom({
      gameMode: gameMode as GameMode,
      jlptLevel: jlptLevel as JlptLevel,
      timePerPromptSeconds: Number(timePerPromptSeconds),
      isPrivate: Boolean(isPrivate),
      maxRounds: Number(maxRounds),
      hostDisplayName: String(hostDisplayName),
      hostUserId: hostUserId ? String(hostUserId) : undefined,
    });

    return NextResponse.json({
      sessionId: session.id,
      roomCode: session.roomCode,
      hostParticipantId: session.hostParticipantId,
      status: session.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
