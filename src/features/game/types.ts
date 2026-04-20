import { GameSessionStatus, GameMode, JlptLevel, ParticipantRole, RoundStatus, PromptType } from "@prisma/client";

export interface CreateGameSessionInput {
  hostParticipantId?: string;
  gameMode: GameMode;
  jlptLevel: JlptLevel;
  timePerPromptSeconds: number;
  isPrivate: boolean;
  maxRounds: number;
}

export interface JoinGameSessionInput {
  roomCode: string;
  userId?: string;
  displayName: string;
}

export interface SubmitAnswerInput {
  gameRoundId: string;
  participantId: string;
  rawAnswer: string;
}

export interface GameParticipantDto {
  id: string;
  userId: string | null;
  displayName: string;
  role: ParticipantRole;
  joinedAt: Date;
}

export interface GameSessionDto {
  id: string;
  roomCode: string;
  gameMode: GameMode;
  status: GameSessionStatus;
  hostParticipantId: string | null;
  jlptLevel: JlptLevel;
  timePerPromptSeconds: number;
  maxRounds: number;
  currentRoundNumber: number;
  participants?: GameParticipantDto[];
}
