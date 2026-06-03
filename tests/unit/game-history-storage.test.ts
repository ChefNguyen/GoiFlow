import { beforeEach, describe, expect, it } from "vitest";
import {
  LAST_GAME_SESSION_KEY,
  MAX_STORED_SESSION_IDS,
  PLAYED_GAME_SESSIONS_KEY,
  migrateGuestHistoryToLocalStorage,
  parseStoredSessionIds,
  readPlayedGameSessionIds,
  rememberPlayedGameSession,
} from "@/features/game/history-storage";

describe("game history storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("parses only valid session IDs", () => {
    expect(parseStoredSessionIds(null)).toEqual([]);
    expect(parseStoredSessionIds("not-json")).toEqual([]);
    expect(parseStoredSessionIds(JSON.stringify({ id: "session-1" }))).toEqual([]);
    expect(parseStoredSessionIds(JSON.stringify(["session-1", "", 123, "session-2"]))).toEqual([
      "session-1",
      "session-2",
    ]);
  });

  it("remembers sessions with dedupe, last session, and cap", () => {
    window.sessionStorage.setItem(
      PLAYED_GAME_SESSIONS_KEY,
      JSON.stringify(Array.from({ length: MAX_STORED_SESSION_IDS }, (_, index) => `session-${index}`)),
    );

    const sessionIds = rememberPlayedGameSession("session-10", window.sessionStorage);

    expect(sessionIds).toHaveLength(MAX_STORED_SESSION_IDS);
    expect(sessionIds[0]).toBe("session-10");
    expect(sessionIds.filter((id) => id === "session-10")).toHaveLength(1);
    expect(window.sessionStorage.getItem(LAST_GAME_SESSION_KEY)).toBe("session-10");
  });

  it("falls back to the last session when played sessions are absent", () => {
    window.sessionStorage.setItem(LAST_GAME_SESSION_KEY, "session-last");

    expect(readPlayedGameSessionIds(window.sessionStorage)).toEqual(["session-last"]);
  });

  it("migrates guest history into local storage and clears session storage", () => {
    window.sessionStorage.setItem(PLAYED_GAME_SESSIONS_KEY, JSON.stringify(["guest-2", "guest-1"]));
    window.sessionStorage.setItem(LAST_GAME_SESSION_KEY, "guest-2");
    window.localStorage.setItem(PLAYED_GAME_SESSIONS_KEY, JSON.stringify(["local-1", "guest-1"]));
    window.localStorage.setItem(LAST_GAME_SESSION_KEY, "local-1");

    const migratedSessionIds = migrateGuestHistoryToLocalStorage();

    expect(migratedSessionIds).toEqual(["guest-2", "guest-1", "local-1"]);
    expect(JSON.parse(window.localStorage.getItem(PLAYED_GAME_SESSIONS_KEY) ?? "[]")).toEqual([
      "guest-2",
      "guest-1",
      "local-1",
    ]);
    expect(window.localStorage.getItem(LAST_GAME_SESSION_KEY)).toBe("guest-2");
    expect(window.sessionStorage.getItem(PLAYED_GAME_SESSIONS_KEY)).toBeNull();
    expect(window.sessionStorage.getItem(LAST_GAME_SESSION_KEY)).toBeNull();
  });
});
