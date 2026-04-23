import { prisma } from "@/server/db/client";
import { CreateGameSessionInput, JoinGameSessionInput } from "../types";
import { GameSessionStatus, JlptLevel, ParticipantRole } from "@prisma/client";
import crypto from "crypto";

export class GameRepository {
  private generateRoomCode(): string {
    return crypto.randomBytes(3).toString("hex").toUpperCase();
  }

  async createGameSession(input: CreateGameSessionInput, hostDisplayName: string, hostUserId?: string) {
    const roomCode = this.generateRoomCode();
    
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
            userId: hostUserId,
            displayName: hostDisplayName,
            role: ParticipantRole.HOST,
          }
        }
      },
      include: {
        participants: true
      }
    });

    // Update host participant ID
    if (session.participants && session.participants.length > 0) {
      await prisma.gameSession.update({
        where: { id: session.id },
        data: { hostParticipantId: session.participants[0].id }
      });
      session.hostParticipantId = session.participants[0].id;
    }

    return session;
  }

  async findGameSessionByCode(roomCode: string) {
    return prisma.gameSession.findUnique({
      where: { roomCode },
      include: {
        participants: true,
      }
    });
  }

  async joinGameSession(sessionId: string, input: JoinGameSessionInput) {
    return prisma.gameParticipant.create({
      data: {
        gameSessionId: sessionId,
        userId: input.userId,
        displayName: input.displayName,
        role: ParticipantRole.PLAYER,
      }
    });
  }

  async startGame(sessionId: string) {
    return prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status: GameSessionStatus.IN_PROGRESS,
        startedAt: new Date(),
        currentRoundNumber: 1
      }
    });
  }

  async loadKanjiContentByLevelAndChunk(level: string, pageSize: number, skip: number) {
    // JLPT level from Prisma enum
    return prisma.kanjiEntry.findMany({
      where: { jlptLevel: level as JlptLevel },
      take: pageSize,
      skip: skip,
      include: {
        acceptedAnswers: true
      }
    });
  }
}
