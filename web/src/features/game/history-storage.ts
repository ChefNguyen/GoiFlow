export const LAST_GAME_SESSION_KEY = "goiflow:last-game-session";
export const PLAYED_GAME_SESSIONS_KEY = "goiflow:played-game-sessions";
export const MAX_STORED_SESSION_IDS = 100;

export type GameHistoryStorageKind = "session" | "local";

export function parseStoredSessionIds(value: string | null) {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
  } catch {
    return [];
  }
}

export function getHistoryStorage(isAuthenticated: boolean) {
  return isAuthenticated ? window.localStorage : window.sessionStorage;
}

export function readPlayedGameSessionIds(storage: Storage) {
  const storedSessionIds = parseStoredSessionIds(storage.getItem(PLAYED_GAME_SESSIONS_KEY));
  const lastSessionId = storage.getItem(LAST_GAME_SESSION_KEY);

  return storedSessionIds.length > 0
    ? storedSessionIds
    : lastSessionId
      ? [lastSessionId]
      : [];
}

export function rememberPlayedGameSession(sessionId: string, storage: Storage) {
  const sessionIds = readPlayedGameSessionIds(storage);
  const nextSessionIds = [sessionId, ...sessionIds.filter((id) => id !== sessionId)].slice(
    0,
    MAX_STORED_SESSION_IDS,
  );

  storage.setItem(LAST_GAME_SESSION_KEY, sessionId);
  storage.setItem(PLAYED_GAME_SESSIONS_KEY, JSON.stringify(nextSessionIds));

  return nextSessionIds;
}

export function migrateGuestHistoryToLocalStorage() {
  const guestSessionIds = readPlayedGameSessionIds(window.sessionStorage);
  const localSessionIds = readPlayedGameSessionIds(window.localStorage);
  const mergedSessionIds = [...guestSessionIds, ...localSessionIds]
    .filter((id, index, ids) => ids.indexOf(id) === index)
    .slice(0, MAX_STORED_SESSION_IDS);
  const guestLastSessionId = window.sessionStorage.getItem(LAST_GAME_SESSION_KEY);

  if (mergedSessionIds.length > 0) {
    window.localStorage.setItem(PLAYED_GAME_SESSIONS_KEY, JSON.stringify(mergedSessionIds));
  }

  if (guestLastSessionId) {
    window.localStorage.setItem(LAST_GAME_SESSION_KEY, guestLastSessionId);
  }

  window.sessionStorage.removeItem(LAST_GAME_SESSION_KEY);
  window.sessionStorage.removeItem(PLAYED_GAME_SESSIONS_KEY);

  return mergedSessionIds;
}
