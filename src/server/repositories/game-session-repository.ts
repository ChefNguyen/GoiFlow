import { prisma } from "@/server/db/client";
import {
  GameMode,
  GameSessionStatus,
  JlptLevel,
  ParticipantRole,
} from "@prisma/client";
import crypto from "crypto";

function generateRoomCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export async function createGameSession(input: {
  gameMode: GameMode;
  jlptLevel: JlptLevel;
  timePerPromptSeconds: number;
  isPrivate: boolean;
  maxRounds: number;
  hostDisplayName: string;
  hostUserId?: string;
}) {
  const roomCode = generateRoomCode();

  const session = await prisma.gameSession.create({
    data: {
      roomCode,
      gameMode: input.gameMode,
      jlptLevel: input.jlptLevel,
      timePerPromptSeconds: input.timePerPromptSeconds,
      isPrivate: input.isPrivate,
      maxRounds: input.maxRounds,
      status: GameSessionStatus.WAITING,
      participants: {
        create: {
          userId: input.hostUserId ?? null,
          displayName: input.hostDisplayName,
          role: ParticipantRole.HOST,
        },
      },
    },
    include: { participants: true },
  });

  // Set hostParticipantId after participant is created
  const hostParticipant = session.participants[0];
  if (hostParticipant) {
    await prisma.gameSession.update({
      where: { id: session.id },
      data: { hostParticipantId: hostParticipant.id },
    });
  }

  return { ...session, hostParticipantId: hostParticipant?.id ?? null };
}

export async function findGameSessionByCode(roomCode: string) {
  return prisma.gameSession.findUnique({
    where: { roomCode },
    include: { participants: true },
  });
}

export async function findGameSessionById(id: string) {
  return prisma.gameSession.findUnique({
    where: { id },
    include: { participants: true, rounds: true },
  });
}

export async function addParticipantToSession(
  gameSessionId: string,
  input: { userId?: string; displayName: string }
) {
  return prisma.gameParticipant.create({
    data: {
      gameSessionId,
      userId: input.userId ?? null,
      displayName: input.displayName,
      role: ParticipantRole.PLAYER,
    },
  });
}

export async function startGameSession(id: string) {
  return prisma.gameSession.update({
    where: { id },
    data: {
      status: GameSessionStatus.IN_PROGRESS,
      startedAt: new Date(),
      currentRoundNumber: 1,
    },
  });
}

export async function finishGameSession(id: string) {
  return prisma.gameSession.update({
    where: { id },
    data: {
      status: GameSessionStatus.FINISHED,
      finishedAt: new Date(),
    },
  });
}
