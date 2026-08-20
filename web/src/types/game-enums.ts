export enum GameSessionStatus {
  WAITING = "WAITING",
  IN_PROGRESS = "IN_PROGRESS",
  FINISHED = "FINISHED",
  CANCELLED = "CANCELLED"
}

export enum GameMode {
  KANJI = "KANJI"
}

export enum JlptLevel {
  N5 = "N5",
  N4 = "N4",
  N3 = "N3",
  N2 = "N2",
  N1 = "N1"
}

export enum ParticipantRole {
  HOST = "HOST",
  PLAYER = "PLAYER"
}

export enum RoundStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  RESOLVED = "RESOLVED",
  SKIPPED = "SKIPPED"
}

export enum PromptType {
  KANJI_TO_READING = "KANJI_TO_READING",
  WORD_TO_READING = "WORD_TO_READING",
  READING_TO_MEANING = "READING_TO_MEANING"
}
