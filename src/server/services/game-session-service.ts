import { GameMode, GameSessionStatus, JlptLevel } from "@prisma/client";
import {
  createGameSession,
  findGameSessionByCode,
  findGameSessionById,
  addParticipantToSession,
  startGameSession,
  finishGameSession,
} from "@/server/repositories/game-session-repository";

export type CreateRoomInput = {
  gameMode: GameMode;
  jlptLevel: JlptLevel;
  timePerPromptSeconds: number;
  isPrivate: boolean;
  maxRounds: number;
  hostDisplayName: string;
  hostUserId?: string;
};

export type JoinRoomInput = {
  roomCode: string;
  displayName: string;
  userId?: string;
};

export async function createRoom(input: CreateRoomInput) {
  if (!input.hostDisplayName.trim()) {
    throw new Error("Host display name is required");
  }
  return createGameSession(input);
}

export async function joinRoom(input: JoinRoomInput) {
  if (!input.displayName.trim()) {
    throw new Error("Display name is required");
  }

  const session = await findGameSessionByCode(input.roomCode);
  if (!session) {
    throw new Error("Room not found");
  }
  if (session.status !== GameSessionStatus.WAITING) {
    throw new Error("Room is not accepting new players");
  }

  return addParticipantToSession(session.id, {
    userId: input.userId,
    displayName: input.displayName,
  });
}

export async function getSessionState(sessionId: string) {
  const session = await findGameSessionById(sessionId);
  if (!session) {
    throw new Error("Session not found");
  }
  return session;
}

export async function startSession(sessionId: string, requestingUserId?: string) {
  const session = await findGameSessionById(sessionId);
  if (!session) throw new Error("Session not found");
  if (session.status !== GameSessionStatus.WAITING) {
    throw new Error("Session is not in WAITING state");
  }
  return startGameSession(sessionId);
}

export async function endSession(sessionId: string) {
  return finishGameSession(sessionId);
}
