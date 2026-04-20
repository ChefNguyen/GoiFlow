import { GameRepository } from "./game.repository";
import { CreateGameSessionInput, JoinGameSessionInput } from "../types";

export class GameService {
  private repository: GameRepository;

  constructor() {
    this.repository = new GameRepository();
  }

  async createRoom(input: CreateGameSessionInput, hostDisplayName: string, hostUserId?: string) {
    if (!hostDisplayName || hostDisplayName.trim() === "") {
      throw new Error("Host display name is required");
    }
    return this.repository.createGameSession(input, hostDisplayName, hostUserId);
  }

  async joinRoom(input: JoinGameSessionInput) {
    const session = await this.repository.findGameSessionByCode(input.roomCode);
    if (!session) {
      throw new Error("Room not found");
    }
    
    if (session.status !== "WAITING") {
      throw new Error("Cannot join room that is already in progress or finished");
    }

    if (session.participants && session.participants.length >= 4) { // arbitrary limit for now
      throw new Error("Room is full");
    }

    return this.repository.joinGameSession(session.id, input);
  }
}
